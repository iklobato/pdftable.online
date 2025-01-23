import asyncio
from io import BytesIO
import json
import traceback
from channels.generic.websocket import AsyncWebsocketConsumer

import base64
import pandas as pd
import camelot
import numpy as np
from django.utils.autoreload import logging

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
                
                # Save PDF to a temporary file
                with open('/tmp/temp_pdf.pdf', 'wb') as f:
                    f.write(pdf_content)
                
                await self.send(json.dumps({
                    'type': 'progress',
                    'message': 'Detecting tables...',
                    'percentage': 30
                }))

                # Use Camelot for more robust table detection
                tables = camelot.read_pdf('/tmp/temp_pdf.pdf', pages='all')
                
                total_tables = len(tables)
                
                if total_tables == 0:
                    await self.send(json.dumps({
                        'type': 'error',
                        'message': 'No tables found in the PDF'
                    }))
                    return

                for idx, table in enumerate(tables):
                    # Calculate progress percentage
                    progress_percentage = 30 + (idx + 1) * (60 / total_tables)
                    
                    await self.send(json.dumps({
                        'type': 'progress',
                        'message': f'Processing table {idx + 1} of {total_tables}',
                        'percentage': progress_percentage
                    }))
                    
                    # Convert table to DataFrame
                    df = table.df
                    
                    # Clean up the DataFrame
                    df = self.clean_dataframe(df)
                    
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
                        'row_count': len(df),
                        'page_number': table.page,
                        'table_area': table.table_bbox
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

    def clean_dataframe(self, df):
        # Remove completely empty rows and columns
        df = df.dropna(how='all', axis=1).dropna(how='all', axis=0)
        
        # Replace NaN with empty string
        df = df.fillna('')
        
        # Remove leading/trailing whitespaces
        df = df.applymap(lambda x: x.strip() if isinstance(x, str) else x)
        
        # Rename columns if they are empty or duplicated
        df.columns = [f'Column {i+1}' if pd.isna(col) or col == '' else col for i, col in enumerate(df.columns)]
        
        # Ensure unique column names
        df.columns = pd.io.parsers.ParserBase({'names':df.columns})._maybe_dedup_names(df.columns)
        
        return df

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

