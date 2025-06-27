
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import subprocess
import zipfile
import shutil
from datetime import datetime
import json
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
CORS(app, origins="*")
socketio = SocketIO(app, cors_allowed_origins="*")

# Configuration
UPLOAD_FOLDER = 'uploads'
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'zip', 'py', 'js', 'html', 'css', 'json', 'md'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create upload directory
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_tree(directory_path, relative_path=''):
    """Get file tree structure"""
    files = []
    try:
        for item in os.listdir(directory_path):
            item_path = os.path.join(directory_path, item)
            rel_path = os.path.join(relative_path, item).replace('\\', '/')
            
            if os.path.isdir(item_path):
                files.extend(get_file_tree(item_path, rel_path))
            else:
                try:
                    with open(item_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                except:
                    content = ''
                
                stat = os.stat(item_path)
                files.append({
                    'name': item,
                    'path': rel_path,
                    'type': 'file',
                    'size': stat.st_size,
                    'content': content,
                    'lastModified': int(stat.st_mtime * 1000)
                })
    except Exception as e:
        print(f"Error reading directory: {e}")
    
    return files

@app.route('/api/files', methods=['GET'])
def get_files():
    """Get all files in the upload directory"""
    try:
        files = get_file_tree(UPLOAD_FOLDER)
        return jsonify(files)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_files():
    """Upload files to server"""
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        uploaded_files = []
        
        for file in files:
            if file and file.filename:
                filename = secure_filename(file.filename)
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                
                # Handle ZIP files
                if filename.lower().endswith('.zip'):
                    file.save(filepath)
                    
                    # Extract ZIP file
                    with zipfile.ZipFile(filepath, 'r') as zip_ref:
                        for member in zip_ref.namelist():
                            if not member.endswith('/'):
                                # Create directory if needed
                                member_path = os.path.join(UPLOAD_FOLDER, member)
                                os.makedirs(os.path.dirname(member_path), exist_ok=True)
                                
                                # Extract file
                                with zip_ref.open(member) as source:
                                    with open(member_path, 'wb') as target:
                                        shutil.copyfileobj(source, target)
                                
                                # Read content for response
                                try:
                                    with open(member_path, 'r', encoding='utf-8') as f:
                                        content = f.read()
                                except:
                                    content = ''
                                
                                uploaded_files.append({
                                    'name': os.path.basename(member),
                                    'path': member.replace('\\', '/'),
                                    'type': 'file',
                                    'size': os.path.getsize(member_path),
                                    'content': content,
                                    'lastModified': int(datetime.now().timestamp() * 1000)
                                })
                    
                    # Remove ZIP file
                    os.remove(filepath)
                else:
                    # Handle regular files
                    file.save(filepath)
                    
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()
                    except:
                        content = ''
                    
                    uploaded_files.append({
                        'name': filename,
                        'path': filename,
                        'type': 'file',
                        'size': os.path.getsize(filepath),
                        'content': content,
                        'lastModified': int(datetime.now().timestamp() * 1000)
                    })
        
        # Broadcast to all connected clients
        socketio.emit('files_uploaded', {'files': uploaded_files})
        
        return jsonify({'success': True, 'files': uploaded_files})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/save', methods=['POST'])
def save_file():
    """Save file content"""
    try:
        data = request.get_json()
        file_path = data.get('path')
        content = data.get('content', '')
        
        if not file_path:
            return jsonify({'error': 'No file path provided'}), 400
        
        full_path = os.path.join(UPLOAD_FOLDER, file_path)
        
        # Create directory if needed
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Write file
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Broadcast update
        socketio.emit('file_updated', {'path': file_path, 'content': content})
        
        return jsonify({'success': True})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<path:file_path>', methods=['DELETE'])
def delete_file(file_path):
    """Delete a file"""
    try:
        full_path = os.path.join(UPLOAD_FOLDER, file_path)
        
        if os.path.exists(full_path):
            os.remove(full_path)
            
            # Broadcast deletion
            socketio.emit('file_deleted', {'path': file_path})
            
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'File not found'}), 404
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/execute', methods=['POST'])
def execute_command():
    """Execute shell command"""
    try:
        data = request.get_json()
        command = data.get('command', '')
        
        if not command:
            return jsonify({'error': 'No command provided'}), 400
        
        print(f"Executing command: {command}")
        
        # Execute command
        result = subprocess.run(
            command,
            shell=True,
            cwd=UPLOAD_FOLDER,
            capture_output=True,
            text=True,
            timeout=60  # 60 second timeout
        )
        
        output = {
            'command': command,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'error': None if result.returncode == 0 else f"Command failed with code {result.returncode}",
            'timestamp': datetime.now().isoformat()
        }
        
        # Broadcast command output
        socketio.emit('command_output', {'output': output})
        
        return jsonify(output)
    
    except subprocess.TimeoutExpired:
        return jsonify({
            'command': command,
            'stdout': '',
            'stderr': '',
            'error': 'Command timeout (60s)',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'command': command,
            'stdout': '',
            'stderr': '',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        })

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
