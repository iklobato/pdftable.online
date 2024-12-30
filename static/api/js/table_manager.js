class TableManager {
    static cleanData(rawData) {
        const validData = rawData.filter(row => {
            const category = row['Unnamed: 0'];
            return category && 
                   ['Blind', 'Low Vision', 'Dexterity', 'Mobility'].includes(category);
        });

        return validData.map(row => ({
            category: row['Unnamed: 0'] || '',
            participants: row['Unnamed: 1'] || '',
            completed: row['Unnamed: 2'] || '',
            incomplete: row['Unnamed: 3'] || '',
            accuracy: row['Unnamed: 4'] || '',
            timeToComplete: row['Results'] || ''
        }));
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
        
        // Create headers with sorting and filtering
        const thead = document.createElement('thead');
        thead.className = 'bg-gray-50';
        const headerRow = document.createElement('tr');
        
        const headers = ['Disability Category', 'Participants', 'Completed Ballots', 
                        'Incomplete/Terminated', 'Accuracy', 'Time to Complete'];
        const keys = ['category', 'participants', 'completed', 'incomplete', 
                     'accuracy', 'timeToComplete'];

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
            sortButton.textContent = header;
            sortButton.onclick = () => this.sortTable(table, index);
            
            titleContainer.appendChild(sortButton);
            
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
            
            keys.forEach(key => {
                const td = document.createElement('td');
                td.className = 'px-6 py-4 whitespace-nowrap';
                
                const input = document.createElement('input');
                input.type = 'text';
                input.value = row[key] || '';
                input.className = 'w-full px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded';
                input.onchange = (e) => {
                    row[key] = e.target.value;
                    this.updateCSVContent(table);
                };
                
                td.appendChild(input);
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        container.appendChild(table);
        
        return container;
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

        // Export Button
        const exportBtn = document.createElement('button');
        exportBtn.className = 'bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700';
        exportBtn.textContent = 'Export CSV';
        exportBtn.onclick = () => this.exportToCSV();

        toolbar.appendChild(addColumnContainer);
        toolbar.appendChild(exportBtn);

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
            headers.join(','),
            ...rows.map(row => 
                Array.from(row.querySelectorAll('input'))
                    .map(input => input.value)
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

