# PDF Table - Convert any table in your PDF file into a CSV table format

PDF Table is a modern web application that makes extracting tables from PDF documents simple and intuitive. With real-time preview and multiple processing options, it transforms complex PDF tables into clean, usable CSV files instantly.

![Screenshot 2024-12-30 at 17 24 18](https://github.com/user-attachments/assets/73e47dc7-139c-4031-8d85-d9201a7350f9)


## ✨ Features

- **Advanced Table Extraction**: 
  - Extract multiple tables from a single PDF document
  - Detailed table information including page number and table area
- **Intelligent Data Analysis**:
  - Automatic column type detection
  - Statistical insights for numeric and categorical data
  - Interactive data visualization
- **Real-time Preview**: See your PDF and the extracted data side by side
- **Multiple Processing Options**:
  - Standard Table Extraction
  - Merge Duplicate Rows
  - Clean and Standardize Headers
  - Fill Empty Cells
  - Remove Empty Rows/Columns
  - Transpose Tables
- **Data Visualization**:
  - Interactive charts (Bar, Line, Pie)
  - Dynamic column selection
  - Instant visual insights
- **Intelligent Table Detection**: 
  - Uses Camelot for robust table recognition
  - Handles complex PDF layouts
- **WebSocket Integration**: Instant updates as you modify processing options
- **Modern UI**: Clean, responsive interface with drag-and-drop support
- **Advanced Data Handling**:
  - Column type inference
  - Input validation
  - Flexible data transformation
- **Export and Sharing**: 
  - One-click CSV copying
  - Export individual or all extracted tables
  - Clear and manage extracted tables

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Java Runtime Environment (JRE)
- uv package manager (`pip install uv`)

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/iklobato/pdftable.online
cd pdftable.online
```

2. Create and activate virtual environment:
```bash
uv venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
```

3. Install dependencies:
```bash
uv pip install django channels daphne "tabula-py[all]" pandas jpype1
```

4. Install system dependencies:

MacOS:
```bash
brew install openjdk
```

Ubuntu/Debian:
```bash
sudo apt-get install default-jdk
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Start the development server:
```bash
python manage.py runserver
```

Visit `http://localhost:8000` to see the application.

## 🏗 Project Structure

```
.
├── api/                    # API application
│   ├── consumers.py       # WebSocket consumers
│   ├── models.py          # Database models
│   └── views.py           # API views
├── core/                  # Project settings
│   ├── asgi.py           # ASGI configuration
│   ├── settings.py       # Django settings
│   ├── urls.py           # URL configuration
│   └── wsgi.py           # WSGI configuration
├── nginx/                 # Nginx configuration
│   ├── conf.d/           # Server blocks
│   └── ssl/              # SSL certificates
├── static/               # Static files
│   └── api/
│       └── js/           # JavaScript modules
├── templates/            # HTML templates
|   └── index.html        # Main page
├── Dockerfile           # Container configuration
├── compose.yaml         # Docker Compose configuration
└── pyproject.toml       # Project dependencies
```

## 🛠 Technology Stack

- **Backend**: Django + Channels
- **PDF Processing**: Tabula-py
- **Frontend**: HTML5 + Tailwind CSS
- **Real-time Updates**: WebSocket
- **PDF Rendering**: PDF.js

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🗺️ Roadmap and Future Improvements

### Upcoming Features

1. **Advanced Table Analysis**
   - Automatic column type detection
   - Data validation and cleaning
   - Machine learning-powered table recognition

2. **Enhanced Export Capabilities**
   - Multiple format exports (Excel, JSON)
   - Cloud storage integration
   - Direct database export

3. **Visualization and Insights**
   - Basic data visualization
   - Statistical summary generation
   - Interactive chart creation

4. **Collaboration Tools**
   - User accounts
   - Shareable table links
   - Version history tracking

5. **Performance Improvements**
   - Parallel table extraction
   - Batch processing
   - Cloud-based processing support

### Community Contributions

We welcome contributions! Check out our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to propose features, report bugs, and submit pull requests.

## 🙏 Acknowledgments

- [Tabula-py](https://github.com/chezou/tabula-py) for PDF table extraction
- [Camelot](https://camelot-py.readthedocs.io/) for advanced table parsing
- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF rendering
- [Tailwind CSS](https://tailwindcss.com/) for styling

