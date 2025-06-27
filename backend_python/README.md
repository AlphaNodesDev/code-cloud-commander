
# Python Flask File Manager Backend

A Python Flask backend for the file manager application with real-time WebSocket support.

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python app.py
```

## VPS Deployment with Nginx

### 1. Install Dependencies on VPS
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv nginx
```

### 2. Setup Application
```bash
# Clone/upload your code to VPS
cd /var/www/filemanager
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Create Systemd Service
Create `/etc/systemd/system/filemanager.service`:
```ini
[Unit]
Description=File Manager Flask App
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/filemanager
Environment=PATH=/var/www/filemanager/venv/bin
ExecStart=/var/www/filemanager/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

### 4. Nginx Configuration
Create `/etc/nginx/sites-available/filemanager`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /var/www/filemanager/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 6. Enable and Start Services
```bash
sudo ln -s /etc/nginx/sites-available/filemanager /etc/nginx/sites-enabled/
sudo systemctl enable filemanager
sudo systemctl start filemanager
sudo systemctl enable nginx
sudo systemctl restart nginx
```

## Features

- File upload (including ZIP extraction)
- Real-time file editing and saving
- File deletion
- Command execution (npm install, python, etc.)
- WebSocket real-time updates
- CORS enabled for frontend connection

## Security Notes

- Command execution is enabled - use with caution
- Add authentication for production use
- Configure firewall rules appropriately
- Use HTTPS in production

## Environment Variables

Set these in your production environment:
- `FLASK_ENV=production`
- `SECRET_KEY=your-secure-secret-key`

## File Storage

Files are stored in the `uploads/` directory relative to the application root.
