
import React, { useCallback, useState } from 'react';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import { FileNode } from '../types/FileManager';

interface FileUploadProps {
  onFilesUploaded: (files: FileNode[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const processFile = async (file: File, basePath: string = ''): Promise<FileNode[]> => {
    const result: FileNode[] = [];
    
    if (file.name.endsWith('.zip')) {
      // Handle ZIP files
      try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        
        for (const [relativePath, zipObject] of Object.entries(zipContent.files)) {
          if (!zipObject.dir) {
            const content = await zipObject.async('text');
            result.push({
              name: relativePath.split('/').pop() || '',
              path: relativePath,
              type: 'file',
              size: content.length,
              content: content,
              lastModified: zipObject.date?.getTime() || Date.now()
            });
          }
        }
      } catch (error) {
        console.error('Error processing ZIP file:', error);
      }
    } else {
      // Handle regular files
      const content = await file.text();
      const path = basePath ? `${basePath}/${file.name}` : file.name;
      
      result.push({
        name: file.name,
        path: path,
        type: 'file',
        size: file.size,
        content: content,
        lastModified: file.lastModified
      });
    }
    
    return result;
  };

  const handleFiles = async (fileList: FileList) => {
    setUploading(true);
    const allFiles: FileNode[] = [];
    const processedFileNames: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const processedFiles = await processFile(file);
        allFiles.push(...processedFiles);
        processedFileNames.push(file.name);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    setUploadedFiles(processedFileNames);
    onFilesUploaded(allFiles);
    setUploading(false);
    
    // Clear the uploaded files list after 3 seconds
    setTimeout(() => {
      setUploadedFiles([]);
    }, 3000);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop your files here
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supports individual files, folders, and ZIP archives
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer transition-colors">
          <File className="w-4 h-4" />
          Choose Files
          <input
            type="file"
            multiple
            accept="*/*,.zip"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-sm text-blue-700">Processing files...</span>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Recently uploaded:</h4>
          {uploadedFiles.map((fileName, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-700">{fileName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
