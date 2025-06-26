
# Full-Stack File Manager

A complete file management system with frontend (React) and backend (Node.js) that allows you to upload, edit, and manage files with a built-in code editor and terminal.

## Features

- **File Upload**: Drag & drop files, folders, and ZIP archives
- **Code Editor**: Built-in editor with syntax highlighting indicators
- **Terminal**: Execute commands like `npm install`, `python`, etc.
- **Real-time Updates**: WebSocket synchronization between frontend and backend
- **File Operations**: Create, edit, delete, download files
- **Directory Tree**: Navigate through file structure
- **Search**: Find files quickly

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Install frontend dependencies (in the main directory):
```bash
npm install
```

2. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. **Upload Files**: Click "Upload" button or drag & drop files
2. **Edit Files**: Click on any file in the directory tree to open the editor
3. **Run Commands**: Click "Terminal" to open the command interface
4. **Save Changes**: Files are automatically saved to the server
5. **Real-time Sync**: Changes are synchronized across all connected clients

## API Endpoints

- `GET /api/files` - Get all files
- `POST /api/upload` - Upload files
- `POST /api/files/save` - Save file content
- `DELETE /api/files/:path` - Delete file
- `POST /api/execute` - Execute shell command

## Security Notes

- Command execution is enabled for development
- Add authentication for production use
- Validate file uploads and command inputs
- Use environment variables for configuration

## File Storage

- Files are stored in `backend/uploads/` directory
- ZIP files are automatically extracted
- Directory structure is preserved
