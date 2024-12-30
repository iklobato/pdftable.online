import asyncio
from io import BytesIO
import json
from channels.generic.websocket import AsyncWebsocketConsumer

import base64
from django.utils.autoreload import logging
from tabula.io import read_pdf

class PDFConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(json.dumps({
            'type': 'progress',
            'message': 'Upload a PDF file to start processing'
        }))

    async def disconnect(self, close_code):
        logging.debug(f"Closed with code: {close_code}")
        pass
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'upload':
            await self.send(json.dumps({
                'type': 'progress',
                'message': f'Processing {data["filename"]}'
            }))

            try:
                content = data['content'].split(',')[1]
                pdf_content = base64.b64decode(content)
                
                await self.send(json.dumps({
                    'type': 'progress',
                    'message': 'Reading tables...'
                }))

                pdf_file = BytesIO(pdf_content)
                dfs = read_pdf(pdf_file, pages='all', multiple_tables=True)
                
                for idx, df in enumerate(dfs):
                    await self.send(json.dumps({
                        'type': 'progress',
                        'message': f'Processing table {idx + 1} of {len(dfs)}'
                    }))
                    
                    df = df.fillna('')
                    df = self.process_table(df, data['operation'])
                    
                    csv_content = df.to_csv(index=False)
                    
                    await self.send(json.dumps({
                        'type': 'table',
                        'content': csv_content
                    }))
                    await asyncio.sleep(0.1)

            except Exception as e:
                await self.send(json.dumps({
                    'type': 'error',
                    'message': str(e)
                }))

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

