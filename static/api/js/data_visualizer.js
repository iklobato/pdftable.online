class DataVisualizer {
    static createChartModal(data, columnTypes) {
        // Find numeric or currency columns
        const numericColumns = Object.keys(columnTypes)
            .filter(col => ['numeric', 'currency'].includes(columnTypes[col]));

        if (numericColumns.length === 0) {
            alert('No numeric columns found for visualization');
            return;
        }

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto';
        
        const title = document.createElement('h2');
        title.className = 'text-2xl font-bold mb-4 text-gray-800';
        title.textContent = 'Data Visualization';
        
        // Chart type selection
        const chartTypeContainer = document.createElement('div');
        chartTypeContainer.className = 'mb-4 flex space-x-2';
        
        const chartTypes = [
            { type: 'bar', icon: 'fa-chart-bar' },
            { type: 'line', icon: 'fa-chart-line' },
            { type: 'pie', icon: 'fa-chart-pie' }
        ];
        
        let currentChartType = 'bar';
        
        // Chart canvas
        const chartCanvas = document.createElement('canvas');
        chartCanvas.id = 'dataVisualizationChart';
        chartCanvas.className = 'w-full h-[500px]';
        
        // Chart type buttons
        chartTypes.forEach(chartType => {
            const btn = document.createElement('button');
            btn.className = `px-4 py-2 rounded ${currentChartType === chartType.type ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`;
            btn.innerHTML = `<i class="fas ${chartType.icon} mr-2"></i>${chartType.type.charAt(0).toUpperCase() + chartType.type.slice(1)}`;
            
            btn.onclick = () => {
                // Update active button
                chartTypes.forEach(t => {
                    const otherBtn = Array.from(chartTypeContainer.children)
                        .find(child => child.querySelector(`i.fa-chart-${t.type}`));
                    otherBtn.className = 'px-4 py-2 rounded bg-gray-200 text-gray-700';
                });
                btn.className = 'px-4 py-2 rounded bg-blue-600 text-white';
                
                currentChartType = chartType.type;
                this.renderChart(data, numericColumns, chartCanvas, currentChartType);
            };
            
            chartTypeContainer.appendChild(btn);
        });
        
        // Column selection
        const columnSelectContainer = document.createElement('div');
        columnSelectContainer.className = 'mb-4 flex space-x-2';
        
        const xAxisSelect = document.createElement('select');
        xAxisSelect.className = 'px-3 py-2 border rounded w-1/2';
        
        const yAxisSelect = document.createElement('select');
        yAxisSelect.className = 'px-3 py-2 border rounded w-1/2';
        
        // Populate column selects
        numericColumns.forEach(col => {
            const xOption = document.createElement('option');
            xOption.value = col;
            xOption.textContent = col;
            xAxisSelect.appendChild(xOption);
            
            const yOption = document.createElement('option');
            yOption.value = col;
            yOption.textContent = col;
            yAxisSelect.appendChild(yOption);
        });
        
        // Add column selects to container
        columnSelectContainer.appendChild(xAxisSelect);
        columnSelectContainer.appendChild(yAxisSelect);
        
        // Update chart on column change
        const updateChartOnChange = () => {
            this.renderChart(
                data, 
                [xAxisSelect.value, yAxisSelect.value], 
                chartCanvas, 
                currentChartType
            );
        };
        
        xAxisSelect.onchange = updateChartOnChange;
        yAxisSelect.onchange = updateChartOnChange;
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.className = 'mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700';
        closeButton.textContent = 'Close';
        closeButton.onclick = () => modal.remove();
        
        // Assemble modal content
        modalContent.appendChild(title);
        modalContent.appendChild(chartTypeContainer);
        modalContent.appendChild(columnSelectContainer);
        modalContent.appendChild(chartCanvas);
        modalContent.appendChild(closeButton);
        
        modal.appendChild(modalContent);
        
        // Close modal when clicking outside
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
        
        document.body.appendChild(modal);
        
        // Initial chart render
        this.renderChart(data, numericColumns.slice(0, 2), chartCanvas, currentChartType);
    }

    static renderChart(data, columns, canvas, chartType) {
        // Ensure Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            return;
        }

        // Destroy existing chart if any
        if (canvas.chart) {
            canvas.chart.destroy();
        }

        // Prepare data
        const [xColumn, yColumn] = columns;
        
        // Extract values
        const xValues = data.map(row => row[xColumn]);
        const yValues = data.map(row => parseFloat(row[yColumn]));

        // Chart configuration
        const chartConfig = {
            type: chartType,
            data: {
                labels: xValues,
                datasets: [{
                    label: `${yColumn} by ${xColumn}`,
                    data: yValues,
                    backgroundColor: this.generateColorPalette(yValues.length),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: yColumn
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: xColumn
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `${yColumn} by ${xColumn}`
                    }
                }
            }
        };

        // Adjust chart type specific options
        if (chartType === 'pie') {
            chartConfig.data.datasets[0].backgroundColor = this.generateColorPalette(yValues.length);
            delete chartConfig.options.scales;
        }

        // Render chart
        canvas.chart = new Chart(canvas, chartConfig);
    }

    static generateColorPalette(count) {
        const colors = [
            'rgba(255, 99, 132, 0.6)',   // Red
            'rgba(54, 162, 235, 0.6)',   // Blue
            'rgba(255, 206, 86, 0.6)',   // Yellow
            'rgba(75, 192, 192, 0.6)',   // Green
            'rgba(153, 102, 255, 0.6)',  // Purple
            'rgba(255, 159, 64, 0.6)',   // Orange
            'rgba(199, 199, 199, 0.6)',  // Grey
            'rgba(83, 102, 255, 0.6)',   // Indigo
            'rgba(40, 159, 64, 0.6)',    // Dark Green
            'rgba(210, 99, 132, 0.6)'    // Dark Red
        ];

        // Cycle through colors if more needed
        return Array.from({length: count}, (_, i) => colors[i % colors.length]);
    }
}

// Export for use in other modules
export default DataVisualizer;