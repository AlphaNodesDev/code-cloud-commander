
import React, { useState, useCallback } from 'react';
import { Upload, FolderOpen, File, Code, Download, Trash2, Plus, Search } from 'lucide-react';
import DirectoryTree from './DirectoryTree';
import CodeEditor from './CodeEditor';
import FileUpload from './FileUpload';
import { FileNode, FileManagerState } from '../types/FileManager';

const FileManager = () => {
  const [state, setState] = useState<FileManagerState>({
    files: [],
    currentFile: null,
    selectedPath: '',
    searchQuery: ''
  });

  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'editor'>('tree');

  const handleFileSelect = useCallback((file: FileNode) => {
    setState(prev => ({
      ...prev,
      currentFile: file,
      selectedPath: file.path
    }));
    setViewMode('editor');
  }, []);

  const handleFilesUploaded = useCallback((uploadedFiles: FileNode[]) => {
    setState(prev => ({
      ...prev,
      files: [...prev.files, ...uploadedFiles]
    }));
    setShowUpload(false);
  }, []);

  const handleFileUpdate = useCallback((path: string, content: string) => {
    setState(prev => ({
      ...prev,
      files: prev.files.map(file => 
        file.path === path ? { ...file, content } : file
      ),
      currentFile: prev.currentFile?.path === path 
        ? { ...prev.currentFile, content }
        : prev.currentFile
    }));
  }, []);

  const handleDeleteFile = useCallback((path: string) => {
    setState(prev => ({
      ...prev,
      files: prev.files.filter(file => !file.path.startsWith(path)),
      currentFile: prev.currentFile?.path === path ? null : prev.currentFile
    }));
  }, []);

  const filteredFiles = state.files.filter(file =>
    file.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
    file.path.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-500" />
              File Manager
            </h1>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={state.searchQuery}
              onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="p-4 border-b border-gray-200 bg-white">
            <FileUpload onFilesUploaded={handleFilesUploaded} />
          </div>
        )}

        {/* File Tree */}
        <div className="flex-1 overflow-auto">
          <DirectoryTree
            files={filteredFiles}
            selectedPath={state.selectedPath}
            onFileSelect={handleFileSelect}
            onDeleteFile={handleDeleteFile}
          />
        </div>

        {/* Stats */}
        <div className="p-4 border-t border-gray-200 bg-white text-sm text-gray-500">
          {state.files.length} files loaded
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {state.currentFile ? (
          <CodeEditor
            file={state.currentFile}
            onSave={handleFileUpdate}
            onClose={() => setState(prev => ({ ...prev, currentFile: null }))}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <FolderOpen className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">Welcome to File Manager</h2>
              <p className="text-gray-500 mb-6 max-w-md">
                Upload your files, folders, or ZIP archives to get started. 
                Create and edit files with our built-in code editor.
              </p>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mx-auto"
              >
                <Upload className="w-5 h-5" />
                Upload Files
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManager;
