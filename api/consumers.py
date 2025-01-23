import asyncio
from io import BytesIO
import json
import traceback
from channels.generic.websocket import AsyncWebsocketConsumer

import base64
import pandas as pd
from django.utils.autoreload import logging
from tabula.io import read_pdf

class PDFConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(json.dumps({
            'type': 'progress',
            'message': 'Upload a PDF file to start processing',
            'percentage': 0
        }))

    async def disconnect(self, close_code):
        logging.debug(f"Closed with code: {close_code}")
        pass
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'upload':
            await self.send(json.dumps({
                'type': 'progress',
                'message': f'Processing {data["filename"]}',
                'percentage': 10
            }))

            try:
                content = data['content'].split(',')[1]
                pdf_content = base64.b64decode(content)
                
                await self.send(json.dumps({
                    'type': 'progress',
                    'message': 'Extracting tables...',
                    'percentage': 30
                }))

                pdf_file = BytesIO(pdf_content)
                dfs = read_pdf(pdf_file, pages='all', multiple_tables=True)
                
                total_tables = len(dfs)
                
                if total_tables == 0:
                    await self.send(json.dumps({
                        'type': 'error',
                        'message': 'No tables found in the PDF'
                    }))
                    return

                for idx, df in enumerate(dfs):
                    # Calculate progress percentage
                    progress_percentage = 30 + (idx + 1) * (60 / total_tables)
                    
                    await self.send(json.dumps({
                        'type': 'progress',
                        'message': f'Processing table {idx + 1} of {total_tables}',
                        'percentage': progress_percentage
                    }))
                    
                    # Fill NaN values with empty string
                    df = df.fillna('')
                    
                    # Apply selected operation
                    df = self.process_table(df, data['operation'])
                    
                    # Convert to CSV
                    csv_content = df.to_csv(index=False)
                    
                    # Send table details
                    await self.send(json.dumps({
                        'type': 'table',
                        'content': csv_content,
                        'table_number': idx + 1,
                        'total_tables': total_tables,
                        'columns': list(df.columns),
                        'row_count': len(df)
                    }))
                    
                    # Small delay to prevent overwhelming the client
                    await asyncio.sleep(0.1)
                
                # Final progress update
                await self.send(json.dumps({
                    'type': 'progress',
                    'message': f'Extracted {total_tables} table(s) successfully',
                    'percentage': 100
                }))

            except Exception as e:
                # Detailed error logging
                error_details = {
                    'type': 'error',
                    'message': str(e),
                    'traceback': traceback.format_exc()
                }
                logging.error(f"PDF Processing Error: {error_details}")
                
                await self.send(json.dumps(error_details))

    def process_table(self, df, operation):
        operations = {
            'basic': lambda x: x,
            'merge_rows': lambda x: x.groupby(x.columns.tolist()).agg('first'),
            'clean_headers': lambda x: x.rename(columns=str.strip).rename(columns=str.lower),
            'fill_empty': lambda x: x.fillna(method='ffill').fillna(''),
            'remove_empty': lambda x: x.dropna(how='all', axis=1).dropna(how='all', axis=0),
            'transpose': lambda x: x.transpose()
        }
        return operations[operation](df)

