class TableManager {
    static detectColumnType(values) {
        // Helper function to detect column type
        const isNumeric = (value) => {
            // Check if the value is a valid number
            return !isNaN(parseFloat(value)) && isFinite(value);
        };

        const isDate = (value) => {
            // Check for various date formats
            const dateFormats = [
                /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
                /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
                /^\d{2}-\d{2}-\d{4}$/,   // DD-MM-YYYY
            ];
            return dateFormats.some(format => format.test(value));
        };

        const isCurrency = (value) => {
            // Check for currency symbols and numeric values
            const currencySymbols = ['$', '€', '£', '¥'];
            return currencySymbols.some(symbol => value.includes(symbol)) && 
                   isNumeric(value.replace(/[^\d.-]/g, ''));
        };

        // Analyze the first few non-empty values
        const nonEmptyValues = values.filter(val => val && val.trim() !== '');
        
        if (nonEmptyValues.length === 0) return 'empty';

        // Check percentage of each type
        const typeChecks = [
            { type: 'currency', check: isCurrency },
            { type: 'numeric', check: isNumeric },
            { type: 'date', check: isDate }
        ];

        const typeCounts = typeChecks.map(typeCheck => ({
            type: typeCheck.type,
            count: nonEmptyValues.filter(typeCheck.check).length
        }));

        const totalNonEmpty = nonEmptyValues.length;
        const typePercentages = typeCounts.map(typeCount => ({
            ...typeCount,
            percentage: (typeCount.count / totalNonEmpty) * 100
        }));

        // Find the dominant type
        const dominantType = typePercentages
            .sort((a, b) => b.percentage - a.percentage)[0];

        // If no clear type or mixed, return 'text'
        return dominantType.percentage > 50 ? dominantType.type : 'text';
    }

    static cleanData(rawData) {
        // If no data or empty data, return empty array
        if (!rawData || rawData.length === 0) return [];

        // Get the keys from the first row
        const keys = Object.keys(rawData[0]);

        // If no keys, return empty array
        if (keys.length === 0) return [];

        // If all keys are 'Unnamed', rename them
        const hasUnnamedColumns = keys.every(key => key.startsWith('Unnamed:'));
        if (hasUnnamedColumns) {
            return rawData.map((row, rowIndex) => {
                const newRow = {};
                keys.forEach((key, colIndex) => {
                    newRow[`Column ${colIndex + 1}`] = row[key] || '';
                });
                return newRow;
            });
        }

        // Detect column types
        const columnTypes = {};
        keys.forEach(key => {
            const columnValues = rawData.map(row => row[key]);
            columnTypes[key] = this.detectColumnType(columnValues);
        });

        // Return the data with column type information
        return rawData.map(row => {
            const cleanedRow = {};
            keys.forEach(key => {
                cleanedRow[key] = row[key] || '';
            });
            cleanedRow['__column_types'] = columnTypes;
            return cleanedRow;
        });
    }

    static createTable(data) {
        const container = document.createElement('div');
        container.className = 'space-y-4';

        // Add toolbar
        const toolbar = this.createToolbar();
        container.appendChild(toolbar);

        // Create table
        const table = document.createElement('table');
        table.className = 'min-w-full divide-y divide-gray-200';
        
        // Dynamically generate headers from data
        const headers = Object.keys(data[0] || {}).filter(header => !header.startsWith('__'));
        
        // Get column types if available
        const columnTypes = data[0]['__column_types'] || {};
        
        // Create headers with sorting and filtering
        const thead = document.createElement('thead');
        thead.className = 'bg-gray-50';
        const headerRow = document.createElement('tr');
        
        headers.forEach((header, index) => {
            const th = document.createElement('th');
            th.className = 'px-6 py-3 text-left';
            
            // Header content container
            const headerContent = document.createElement('div');
            headerContent.className = 'space-y-2';
            
            // Header title and sort button
            const titleContainer = document.createElement('div');
            titleContainer.className = 'flex items-center justify-between';
            
            const sortButton = document.createElement('button');
            sortButton.className = 'text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700';
            
            // Add column type badge
            const columnType = columnTypes[header] || 'text';
            const typeColors = {
                'numeric': 'bg-blue-100 text-blue-800',
                'currency': 'bg-green-100 text-green-800',
                'date': 'bg-purple-100 text-purple-800',
                'text': 'bg-gray-100 text-gray-800'
            };
            
            const typeSpan = document.createElement('span');
            typeSpan.className = `ml-2 px-2 py-1 rounded text-xs ${typeColors[columnType] || typeColors['text']}`;
            typeSpan.textContent = columnType;
            
            sortButton.textContent = header;
            sortButton.onclick = () => this.sortTable(table, index);
            
            titleContainer.appendChild(sortButton);
            titleContainer.appendChild(typeSpan);
            
            // Filter input
            const filter = document.createElement('input');
            filter.type = 'text';
            filter.placeholder = 'Filter...';
            filter.className = 'px-2 py-1 text-sm border rounded w-full';
            filter.oninput = (e) => this.filterTable(table, index, e.target.value);
            
            headerContent.appendChild(titleContainer);
            headerContent.appendChild(filter);
            th.appendChild(headerContent);
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create tbody with editable cells
        const tbody = document.createElement('tbody');
        tbody.className = 'bg-white divide-y divide-gray-200';
        
        data.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            tr.className = rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            
            headers.forEach(header => {
                const td = document.createElement('td');
                td.className = 'px-6 py-4 whitespace-nowrap';
                
                const input = document.createElement('input');
                input.type = 'text';
                input.value = row[header] || '';
                input.className = 'w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded';
                input.onchange = (e) => {
                    row[header] = e.target.value;
                    this.updateCSVContent(table);
                };
                
                // Add input validation based on column type
                const columnType = columnTypes[header] || 'text';
                switch(columnType) {
                    case 'numeric':
                        input.pattern = '\\d*';
                        input.title = 'Numeric values only';
                        break;
                    case 'currency':
                        input.pattern = '[\\$€£¥]?\\d*\\.?\\d*';
                        input.title = 'Currency values only';
                        break;
                    case 'date':
                        input.pattern = '\\d{4}-\\d{2}-\\d{2}';
                        input.title = 'Date format: YYYY-MM-DD';
                        break;
                }
                
                td.appendChild(input);
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        container.appendChild(table);
        
        return container;
    }

    static calculateColumnStatistics(data, columnTypes) {
        const statistics = {};

        // Iterate through columns
        Object.keys(columnTypes).forEach(column => {
            const columnType = columnTypes[column];
            const values = data.map(row => row[column]).filter(val => val !== '');

            // Basic statistics for numeric and currency columns
            if (['numeric', 'currency'].includes(columnType)) {
                const numericValues = values.map(val => parseFloat(val.replace(/[^\d.-]/g, '')));
                
                statistics[column] = {
                    type: columnType,
                    count: values.length,
                    min: Math.min(...numericValues),
                    max: Math.max(...numericValues),
                    average: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
                    sum: numericValues.reduce((a, b) => a + b, 0)
                };
            } 
            // Date column statistics
            else if (columnType === 'date') {
                const sortedDates = values.sort();
                
                statistics[column] = {
                    type: columnType,
                    count: values.length,
                    earliest: sortedDates[0],
                    latest: sortedDates[sortedDates.length - 1]
                };
            }
            // Text column statistics
            else {
                const uniqueValues = new Set(values);
                
                statistics[column] = {
                    type: columnType,
                    count: values.length,
                    uniqueCount: uniqueValues.size
                };
            }
        });

        return statistics;
    }

    static createStatisticsModal(statistics) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto';
        
        const title = document.createElement('h2');
        title.className = 'text-xl font-bold mb-4 text-gray-800';
        title.textContent = 'Table Statistics';
        
        const statsTable = document.createElement('table');
        statsTable.className = 'w-full border-collapse';
        
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr class="bg-gray-100">
                <th class="border p-2">Column</th>
                <th class="border p-2">Type</th>
                <th class="border p-2">Statistics</th>
            </tr>
        `;
        
        const tbody = document.createElement('tbody');
        
        Object.entries(statistics).forEach(([column, stats]) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const columnCell = document.createElement('td');
            columnCell.className = 'border p-2 font-medium';
            columnCell.textContent = column;
            
            const typeCell = document.createElement('td');
            typeCell.className = 'border p-2';
            typeCell.textContent = stats.type;
            
            const statsCell = document.createElement('td');
            statsCell.className = 'border p-2';
            
            // Render different stats based on column type
            const statsDetails = document.createElement('div');
            statsDetails.className = 'space-y-1';
            
            statsDetails.innerHTML = `
                <div>Count: ${stats.count}</div>
                ${stats.type === 'numeric' || stats.type === 'currency' ? `
                    <div>Min: ${stats.min.toFixed(2)}</div>
                    <div>Max: ${stats.max.toFixed(2)}</div>
                    <div>Average: ${stats.average.toFixed(2)}</div>
                    <div>Sum: ${stats.sum.toFixed(2)}</div>
                ` : ''}
                ${stats.type === 'date' ? `
                    <div>Earliest: ${stats.earliest}</div>
                    <div>Latest: ${stats.latest}</div>
                ` : ''}
                ${stats.type === 'text' ? `
                    <div>Unique Values: ${stats.uniqueCount}</div>
                ` : ''}
            `;
            
            statsCell.appendChild(statsDetails);
            
            row.appendChild(columnCell);
            row.appendChild(typeCell);
            row.appendChild(statsCell);
            
            tbody.appendChild(row);
        });
        
        statsTable.appendChild(thead);
        statsTable.appendChild(tbody);
        
        const closeButton = document.createElement('button');
        closeButton.className = 'mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700';
        closeButton.textContent = 'Close';
        closeButton.onclick = () => modal.remove();
        
        modalContent.appendChild(title);
        modalContent.appendChild(statsTable);
        modalContent.appendChild(closeButton);
        
        modal.appendChild(modalContent);
        
        // Close modal when clicking outside
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
        
        document.body.appendChild(modal);
    }

    static createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'flex justify-between items-center p-4 bg-white rounded-lg shadow';

        // Add Column Button
        const addColumnContainer = document.createElement('div');
        addColumnContainer.className = 'flex gap-2';

        const columnInput = document.createElement('input');
        columnInput.type = 'text';
        columnInput.placeholder = 'New column name...';
        columnInput.className = 'px-3 py-2 border rounded';

        const addColumnBtn = document.createElement('button');
        addColumnBtn.className = 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700';
        addColumnBtn.textContent = 'Add Column';
        addColumnBtn.onclick = () => this.addColumn(columnInput.value);

        addColumnContainer.appendChild(columnInput);
        addColumnContainer.appendChild(addColumnBtn);

        // Export, Statistics, and Visualization Buttons
        const actionContainer = document.createElement('div');
        actionContainer.className = 'flex gap-2';

        const statsBtn = document.createElement('button');
        statsBtn.className = 'bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center';
        statsBtn.innerHTML = '<i class="fas fa-chart-bar mr-2"></i>Statistics';
        statsBtn.onclick = () => {
            const table = document.querySelector('table');
            const rows = Array.from(table.querySelectorAll('tbody tr'))
                .map(row => {
                    const rowData = {};
                    row.querySelectorAll('input').forEach((input, index) => {
                        const header = table.querySelectorAll('thead th')[index].querySelector('button').textContent;
                        rowData[header] = input.value;
                    });
                    return rowData;
                });
            
            const columnTypes = rows[0]['__column_types'] || {};
            const statistics = this.calculateColumnStatistics(rows, columnTypes);
            this.createStatisticsModal(statistics);
        };

        const visualizeBtn = document.createElement('button');
        visualizeBtn.className = 'bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 flex items-center';
        visualizeBtn.innerHTML = '<i class="fas fa-chart-pie mr-2"></i>Visualize';
        visualizeBtn.onclick = async () => {
            // Dynamically import DataVisualizer
            const { default: DataVisualizer } = await import('./data_visualizer.js');
            
            const table = document.querySelector('table');
            const rows = Array.from(table.querySelectorAll('tbody tr'))
                .map(row => {
                    const rowData = {};
                    row.querySelectorAll('input').forEach((input, index) => {
                        const header = table.querySelectorAll('thead th')[index].querySelector('button').textContent;
                        rowData[header] = input.value;
                    });
                    return rowData;
                });
            
            const columnTypes = rows[0]['__column_types'] || {};
            DataVisualizer.createChartModal(rows, columnTypes);
        };

        const exportBtn = document.createElement('button');
        exportBtn.className = 'bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center';
        exportBtn.innerHTML = '<i class="fas fa-file-export mr-2"></i>Export CSV';
        exportBtn.onclick = () => this.exportToCSV();

        actionContainer.appendChild(statsBtn);
        actionContainer.appendChild(visualizeBtn);
        actionContainer.appendChild(exportBtn);

        toolbar.appendChild(addColumnContainer);
        toolbar.appendChild(actionContainer);

        return toolbar;
    }

    static sortTable(table, columnIndex) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const sortDirection = tbody.dataset.sortDirection === 'asc' ? 'desc' : 'asc';
        
        rows.sort((a, b) => {
            const aValue = a.querySelectorAll('input')[columnIndex].value;
            const bValue = b.querySelectorAll('input')[columnIndex].value;
            
            if (sortDirection === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
        
        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
        tbody.dataset.sortDirection = sortDirection;
    }

    static filterTable(table, columnIndex, filterValue) {
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const cell = row.querySelectorAll('input')[columnIndex];
            const value = cell.value.toLowerCase();
            const filter = filterValue.toLowerCase();
            
            row.style.display = value.includes(filter) ? '' : 'none';
        });
    }

    static addColumn(columnName) {
        if (!columnName) return;
        
        const table = document.querySelector('table');
        const headers = table.querySelectorAll('thead th');
        const rows = table.querySelectorAll('tbody tr');
        
        // Add header
        const th = document.createElement('th');
        th.className = 'px-6 py-3 text-left';
        
        const headerContent = document.createElement('div');
        headerContent.className = 'space-y-2';
        
        const titleContainer = document.createElement('div');
        titleContainer.className = 'flex items-center justify-between';
        
        const sortButton = document.createElement('button');
        sortButton.className = 'text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700';
        sortButton.textContent = columnName;
        sortButton.onclick = () => this.sortTable(table, headers.length);
        
        titleContainer.appendChild(sortButton);
        
        const filter = document.createElement('input');
        filter.type = 'text';
        filter.placeholder = 'Filter...';
        filter.className = 'px-2 py-1 text-sm border rounded w-full';
        filter.oninput = (e) => this.filterTable(table, headers.length, e.target.value);
        
        headerContent.appendChild(titleContainer);
        headerContent.appendChild(filter);
        th.appendChild(headerContent);
        
        table.querySelector('thead tr').appendChild(th);
        
        // Add cells
        rows.forEach(row => {
            const td = document.createElement('td');
            td.className = 'px-6 py-4 whitespace-nowrap';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded';
            input.onchange = () => this.updateCSVContent(table);
            
            td.appendChild(input);
            row.appendChild(td);
        });
    }

    static updateCSVContent(table) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const headers = Array.from(table.querySelectorAll('thead th'))
            .map(th => th.querySelector('button').textContent);
        
        const csvContent = [
            headers.map(header => `"${header.replace(/"/g, '""')}"`).join(','),
            ...rows.map(row => 
                Array.from(row.querySelectorAll('input'))
                    .map(input => {
                        const value = input.value;
                        // Escape double quotes and wrap in quotes
                        return `"${value.replace(/"/g, '""')}"`;
                    })
                    .join(',')
            )
        ].join('\n');
        
        // Update global CSV content
        window.pdfProcessor.csvContent = csvContent;
    }

    static exportToCSV() {
        const table = document.querySelector('table');
        this.updateCSVContent(table);
        
        const blob = new Blob([window.pdfProcessor.csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exported_data.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

