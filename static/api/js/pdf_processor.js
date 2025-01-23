class PDFProcessor {
    constructor() {
        this.ws = null;
        this.csvContent = '';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.outputElement = document.getElementById('csvOutput');
        this.history = [];
        this.currentHistoryIndex = -1;
        this.connectWebSocket();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.ws = new WebSocket(`${protocol}//${window.location.host}/ws/pdf/`);
        this.setupWebSocketHandlers();
    }

    setupWebSocketHandlers() {
        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.outputElement.textContent = 'Connected and ready for PDFs';
            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (e) => this.handleWebSocketMessage(e);
        this.ws.onerror = (error) => console.log('WebSocket error:', error);
        this.ws.onclose = () => this.handleWebSocketClose();
    }

    handleWebSocketMessage(e) {
        try {
            const data = JSON.parse(e.data);
            console.log('Received message:', data);

            switch(data.type) {
                case 'progress':
                    this.updateOutput(`<div class="text-blue-600">${data.message}</div>`);
                    this.updateProgressBar(data.percentage || 0);
                    break;
                    
                case 'table':
                    this.csvContent = data.content;
                    const rows = this.parseCSV(data.content);
                    console.log('Parsed rows:', rows);
                    
                    const cleanedData = TableManager.cleanData(rows);
                    console.log('Cleaned data:', cleanedData);
                    
                    // Increment extracted tables count
                    this.extractedTables++;
                    this.updateTableCount();
                    
                    // Append table details to the output
                    const tableDetails = document.createElement('div');
                    tableDetails.className = 'bg-gray-100 p-3 rounded-lg mb-4 space-y-2';
                    tableDetails.innerHTML = `
                        <div class="flex justify-between items-center">
                            <h4 class="font-semibold text-gray-700">Table ${data.table_number} of ${data.total_tables}</h4>
                            <span class="text-sm text-gray-600">${data.row_count} rows, ${data.columns.length} columns</span>
                        </div>
                        <div class="text-sm text-gray-500">
                            <div>Columns: ${data.columns.join(', ')}</div>
                            <div class="mt-1">
                                <strong>Page:</strong> ${data.page_number} 
                                <span class="ml-2"><strong>Table Area:</strong> ${JSON.stringify(data.table_area)}</span>
                            </div>
                        </div>
                    `;
                    this.outputElement.appendChild(tableDetails);
                    
                    if (cleanedData.length > 0) {
                        const table = TableManager.createTable(cleanedData);
                        this.outputElement.appendChild(table);
                        this.addToHistory(cleanedData);
                        this.showNotification(`Table ${data.table_number} extracted successfully from page ${data.page_number}`);
                    } else {
                        this.updateOutput('No valid data found in the table');
                    }
                    break;
                    
                case 'error':
                    const errorMessage = data.traceback || data.message;
                    this.updateOutput(`
                        <div class="text-red-600 bg-red-50 p-4 rounded-lg">
                            <strong>Error Processing PDF:</strong>
                            <pre class="text-sm mt-2 overflow-auto">${errorMessage}</pre>
                        </div>
                    `);
                    this.showNotification('Error processing file', 'error');
                    break;
            }
        } catch (error) {
            console.error('Message processing error:', error);
            this.updateOutput('Error processing data');
        }
    }

    setupEventListeners() {
        // Track extracted tables
        this.extractedTables = 0;

        // File selection
        const fileInput = document.getElementById('pdfFile');
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            document.getElementById('fileName').textContent = file ? file.name : 'No file';
            console.log('File selected:', file?.name);
            
            // Automatically process with Standard Extraction
            if (file) {
                this.processFile(file, 'basic');
            }
        });

        // Copy button
        document.getElementById('copyBtn').onclick = () => {
            if (!this.csvContent) return;
            navigator.clipboard.writeText(this.csvContent);
            this.updateCopyButton(true);
            this.showNotification('CSV copied to clipboard');
        };

        // Clear tables button
        document.getElementById('clearTablesBtn').onclick = () => {
            this.clearTables();
        };

        // Upload form
        document.getElementById('uploadForm').onsubmit = async (e) => {
            e.preventDefault();
            const file = document.getElementById('pdfFile').files[0];
            const operation = document.getElementById('operation').value;
            await this.processFile(file, operation);
        };

        // Add download button event listener
        document.getElementById('downloadBtn')?.addEventListener('click', () => {
            this.downloadCurrentTable();
        });

        // Add undo/redo buttons
        document.getElementById('undoBtn')?.addEventListener('click', () => this.undo());
        document.getElementById('redoBtn')?.addEventListener('click', () => this.redo());
    }

    clearTables() {
        // Reset output
        this.outputElement.innerHTML = '';
        
        // Reset CSV content
        this.csvContent = '';
        
        // Reset extracted tables count
        this.extractedTables = 0;
        this.updateTableCount();
        
        // Reset history
        this.history = [];
        this.currentHistoryIndex = -1;
        this.updateUndoRedoButtons();
        
        // Show notification
        this.showNotification('All tables cleared');
    }

    updateTableCount() {
        const tableCountElement = document.getElementById('tableCount');
        if (tableCountElement) {
            if (this.extractedTables === 0) {
                tableCountElement.textContent = 'No tables extracted';
                tableCountElement.className = 'text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded';
            } else {
                tableCountElement.textContent = `${this.extractedTables} table(s) extracted`;
                tableCountElement.className = 'text-sm text-green-600 bg-green-100 px-2 py-1 rounded';
            }
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Z for Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for Redo
            if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
                e.preventDefault();
                this.redo();
            }
            // Ctrl/Cmd + S for Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.downloadCurrentTable();
            }
        });
    }

    addToHistory(data) {
        // Remove any future states if we're in the middle of the history
        this.history = this.history.slice(0, this.currentHistoryIndex + 1);
        this.history.push(JSON.parse(JSON.stringify(data)));
        this.currentHistoryIndex = this.history.length - 1;
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.currentHistoryIndex > 0) {
            this.currentHistoryIndex--;
            this.renderHistoryState();
        }
    }

    redo() {
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.currentHistoryIndex++;
            this.renderHistoryState();
        }
    }

    renderHistoryState() {
        const data = this.history[this.currentHistoryIndex];
        this.outputElement.innerHTML = '';
        const table = TableManager.createTable(data);
        this.outputElement.appendChild(table);
        this.updateUndoRedoButtons();
    }

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) undoBtn.disabled = this.currentHistoryIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.currentHistoryIndex >= this.history.length - 1;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateProgressBar(percentage) {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.textContent = `${percentage}%`;
        }
    }

    updateCopyButton(copied) {
        const btn = document.getElementById('copyBtn');
        if (copied) {
            btn.innerHTML = '<i class="fas fa-check mr-2"></i>Copied!';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-copy mr-2"></i>Copy CSV';
            }, 2000);
        }
    }

    downloadCurrentTable() {
        if (!this.csvContent) return;
        
        const blob = new Blob([this.csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.href = url;
        a.download = `table_export_${timestamp}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showNotification('Table downloaded successfully');
    }

    parseCSV(csvContent) {
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',');
        
        return lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
                obj[header.trim()] = values[index]?.trim() || '';
                return obj;
            }, {});
        });
    }

    handleWebSocketClose() {
        console.log('WebSocket closed');
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.updateOutput(`Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connectWebSocket(), 
                      this.reconnectDelay * this.reconnectAttempts);
        } else {
            this.updateOutput('Connection failed - Please refresh');
        }
    }

    updateOutput(text) {
        if (this.outputElement) {
            if (typeof text === 'string' && text.startsWith('<')) {
                this.outputElement.innerHTML = text;
            } else {
                this.outputElement.textContent = text;
            }
        }
    }

    async processFile(file, operation) {
        if (!file) {
            this.updateOutput('Please select a PDF file');
            this.showNotification('No file selected', 'error');
            return;
        }

        if (this.ws.readyState !== WebSocket.OPEN) {
            this.updateOutput('Connection lost - Please wait');
            this.showNotification('Connection lost', 'error');
            return;
        }

        this.csvContent = '';
        const reader = new FileReader();
        
        try {
            const content = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // Reset progress bar
            this.updateProgressBar(0);
            
            // Send file for processing
            this.ws.send(JSON.stringify({
                type: 'upload',
                filename: file.name,
                operation,
                content
            }));
            
            this.updateOutput('Processing PDF...');
            console.log('PDF upload started:', file.name);
            this.showNotification('Processing started');
            
            // Clear history for new file
            this.history = [];
            this.currentHistoryIndex = -1;
            this.updateUndoRedoButtons();
            
        } catch (error) {
            console.error('File reading error:', error);
            this.updateOutput('Error reading file');
            this.showNotification('Error reading file', 'error');
        }
    }

    validateFile(file) {
        // Check file type
        if (!file.type.includes('pdf')) {
            this.showNotification('Please select a PDF file', 'error');
            return false;
        }

        // Check file size (e.g., limit to 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            this.showNotification('File size exceeds 10MB limit', 'error');
            return false;
        }

        return true;
    }

    getTableData() {
        // Get current table data
        const table = this.outputElement.querySelector('table');
        if (!table) return null;

        const headers = Array.from(table.querySelectorAll('thead th'))
            .map(th => th.querySelector('button').textContent);

        const rows = Array.from(table.querySelectorAll('tbody tr'))
            .map(row => {
                const cells = Array.from(row.querySelectorAll('td input'));
                return headers.reduce((obj, header, index) => {
                    obj[header] = cells[index].value;
                    return obj;
                }, {});
            });

        return { headers, rows };
    }

    autoSave() {
        const data = this.getTableData();
        if (data) {
            localStorage.setItem('tableData', JSON.stringify(data));
            localStorage.setItem('lastSaved', new Date().toISOString());
        }
    }

    restoreAutoSave() {
        const savedData = localStorage.getItem('tableData');
        if (savedData) {
            const data = JSON.parse(savedData);
            const lastSaved = localStorage.getItem('lastSaved');
            
            if (data.rows.length > 0) {
                this.outputElement.innerHTML = '';
                const table = TableManager.createTable(data.rows);
                this.outputElement.appendChild(table);
                this.showNotification(`Restored data from ${new Date(lastSaved).toLocaleString()}`);
            }
        }
    }

    cleanup() {
        // Clear autoSave data
        localStorage.removeItem('tableData');
        localStorage.removeItem('lastSaved');
        
        // Clear history
        this.history = [];
        this.currentHistoryIndex = -1;
        this.updateUndoRedoButtons();
        
        // Clear the output
        this.outputElement.innerHTML = '';
        
        // Reset progress bar
        this.updateProgressBar(0);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PDFProcessor());
} else {
    new PDFProcessor();
}

