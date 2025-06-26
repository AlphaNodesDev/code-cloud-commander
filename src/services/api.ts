
const API_BASE_URL = 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CommandOutput {
  command: string;
  stdout: string;
  stderr: string;
  error: string | null;
  timestamp: string;
}

class ApiService {
  async getFiles() {
    const response = await fetch(`${API_BASE_URL}/files`);
    return response.json();
  }

  async uploadFiles(files: FileList) {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    return response.json();
  }

  async saveFile(path: string, content: string) {
    const response = await fetch(`${API_BASE_URL}/files/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, content }),
    });

    return response.json();
  }

  async deleteFile(path: string) {
    const response = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });

    return response.json();
  }

  async executeCommand(command: string): Promise<CommandOutput> {
    const response = await fetch(`${API_BASE_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command }),
    });

    return response.json();
  }
}

export const apiService = new ApiService();
