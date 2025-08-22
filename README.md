# PDF Table - Convert any table in your PDF file into a CSV table format

PDF Table is a modern web application that makes extracting tables from PDF documents simple and intuitive. With real-time preview and multiple processing options, it transforms complex PDF tables into clean, usable CSV files instantly.

![Screenshot 2024-12-30 at 17 24 18](https://github.com/user-attachments/assets/73e47dc7-139c-4031-8d85-d9201a7350f9)


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

6. Collect static files:
```bash
python manage.py collectstatic
```

7. Start the development server:
```bash
daphne core.asgi:application
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

## 🙏 Acknowledgments

- [Tabula-py](https://github.com/chezou/tabula-py) for PDF table extraction
- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF rendering
- [Tailwind CSS](https://tailwindcss.com/) for styling

