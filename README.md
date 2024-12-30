# PDF Table - PDF Table to CSV Converter

PDF Table is a modern web application that makes extracting tables from PDF documents simple and intuitive. With real-time preview and multiple processing options, it transforms complex PDF tables into clean, usable CSV files instantly.

![PDF Table Screenshot](https://via.placeholder.com/800x400.png?text=PDF Table+Interface)

## ✨ Features

- **Real-time Preview**: See your PDF and the extracted data side by side
- **Multiple Processing Options**:
  - Standard Table Extraction
  - Merge Duplicate Rows
  - Clean and Standardize Headers
  - Fill Empty Cells
  - Remove Empty Rows/Columns
  - Transpose Tables
- **WebSocket Integration**: Instant updates as you modify processing options
- **Modern UI**: Clean, responsive interface with drag-and-drop support
- **Copy to Clipboard**: One-click CSV copying

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
pdf_converter_project/
├── manage.py
├── pdf_converter/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── core/
│       ├── __init__.py
│       ├── views.py
│       ├── consumers.py
│       └── templates/
│           └── index.html
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

## 🙏 Acknowledgments

- [Tabula-py](https://github.com/chezou/tabula-py) for PDF table extraction
- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF rendering
- [Tailwind CSS](https://tailwindcss.com/) for styling

