
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const WebSocket = require('ws');
const http = require('http');
const JSZip = require('jszip');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('uploads'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// WebSocket for real-time updates
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected');
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
  });
});

function broadcast(data) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Helper function to get file tree
async function getFileTree(dirPath, relativePath = '') {
  const files = [];
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      const relPath = path.join(relativePath, item.name);
      
      if (item.isDirectory()) {
        const children = await getFileTree(fullPath, relPath);
        files.push(...children);
      } else {
        const stats = await fs.stat(fullPath);
        const content = await fs.readFile(fullPath, 'utf-8').catch(() => '');
        
        files.push({
          name: item.name,
          path: relPath.replace(/\\/g, '/'),
          type: 'file',
          size: stats.size,
          content: content,
          lastModified: stats.mtime.getTime()
        });
      }
    }
  } catch (error) {
    console.error('Error reading directory:', error);
  }
  
  return files;
}

// Routes

// Get all files
app.get('/api/files', async (req, res) => {
  try {
    const files = await getFileTree(uploadsDir);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read files' });
  }
});

// Upload files
app.post('/api/upload', upload.array('files'), async (req, res) => {
  try {
    const uploadedFiles = [];
    
    for (const file of req.files) {
      if (file.originalname.endsWith('.zip')) {
        // Handle ZIP files
        const zipData = await fs.readFile(file.path);
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(zipData);
        
        for (const [relativePath, zipObject] of Object.entries(zipContent.files)) {
          if (!zipObject.dir) {
            const content = await zipObject.async('text');
            const filePath = path.join(uploadsDir, relativePath);
            
            // Create directory if it doesn't exist
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, content);
            
            uploadedFiles.push({
              name: path.basename(relativePath),
              path: relativePath.replace(/\\/g, '/'),
              type: 'file',
              size: content.length,
              content: content,
              lastModified: Date.now()
            });
          }
        }
        
        // Remove the zip file
        await fs.unlink(file.path);
      } else {
        // Handle regular files
        const content = await fs.readFile(file.path, 'utf-8').catch(() => '');
        uploadedFiles.push({
          name: file.originalname,
          path: file.originalname,
          type: 'file',
          size: file.size,
          content: content,
          lastModified: Date.now()
        });
      }
    }
    
    broadcast({ type: 'files_uploaded', files: uploadedFiles });
    res.json({ success: true, files: uploadedFiles });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Save file content
app.post('/api/files/save', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    const fullPath = path.join(uploadsDir, filePath);
    
    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
    
    broadcast({ type: 'file_updated', path: filePath, content });
    res.json({ success: true });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// Delete file
app.delete('/api/files/:path(*)', async (req, res) => {
  try {
    const filePath = req.params.path;
    const fullPath = path.join(uploadsDir, filePath);
    
    await fs.unlink(fullPath);
    broadcast({ type: 'file_deleted', path: filePath });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Execute command
app.post('/api/execute', (req, res) => {
  const { command } = req.body;
  
  console.log('Executing command:', command);
  
  exec(command, { cwd: uploadsDir }, (error, stdout, stderr) => {
    const output = {
      command,
      stdout: stdout || '',
      stderr: stderr || '',
      error: error ? error.message : null,
      timestamp: new Date().toISOString()
    };
    
    broadcast({ type: 'command_output', output });
    res.json(output);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Files will be saved to: ${uploadsDir}`);
});
