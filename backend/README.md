
# File Manager Backend

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

## Features

- File upload (including ZIP extraction)
- Real-time file editing and saving
- File deletion
- Command execution (npm install, python, etc.)
- WebSocket real-time updates
- CORS enabled for frontend connection

## API Endpoints

- `GET /api/files` - Get all files
- `POST /api/upload` - Upload files
- `POST /api/files/save` - Save file content
- `DELETE /api/files/:path` - Delete file
- `POST /api/execute` - Execute shell command

## Configuration

- Server runs on port 5000 by default
- Files are saved to `uploads/` directory
- WebSocket server runs on the same port

## Security Notes

Command execution is enabled - use with caution in production environments.
Consider adding authentication and input validation for production use.
