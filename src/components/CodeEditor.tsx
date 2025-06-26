
import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Download, Copy, RotateCcw } from 'lucide-react';
import { FileNode } from '../types/FileManager';

interface CodeEditorProps {
  file: FileNode;
  onSave: (path: string, content: string) => void;
  onClose: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ file, onSave, onClose }) => {
  const [content, setContent] = useState(file.content || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(file.content || '');
    setHasChanges(false);
  }, [file]);

  useEffect(() => {
    const lines = content.split('\n').length;
    setLineCount(lines);
  }, [content]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(newContent !== file.content);
  };

  const handleSave = () => {
    onSave(file.path, content);
    setHasChanges(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      setHasChanges(true);
      
      setTimeout(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      }, 0);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
  };

  const downloadFile = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetContent = () => {
    setContent(file.content || '');
    setHasChanges(false);
  };

  const getLanguageFromExtension = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': return 'JavaScript';
      case 'jsx': return 'JSX';
      case 'ts': return 'TypeScript';
      case 'tsx': return 'TSX';
      case 'html': return 'HTML';
      case 'css': return 'CSS';
      case 'json': return 'JSON';
      case 'md': return 'Markdown';
      case 'py': return 'Python';
      case 'java': return 'Java';
      case 'php': return 'PHP';
      case 'rb': return 'Ruby';
      case 'go': return 'Go';
      case 'rs': return 'Rust';
      default: return 'Text';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <h2 className="font-medium text-gray-900">{file.name}</h2>
          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">
            {getLanguageFromExtension(file.name)}
          </span>
          {hasChanges && (
            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded">
              Unsaved changes
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          <button
            onClick={downloadFile}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          {hasChanges && (
            <button
              onClick={resetContent}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex">
        {/* Line numbers */}
        <div className="bg-gray-50 border-r border-gray-200 px-3 py-4 text-right text-sm text-gray-500 font-mono select-none">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>
        
        {/* Text area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-4 font-mono text-sm leading-6 resize-none focus:outline-none"
            placeholder="Start typing..."
            spellCheck={false}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-sm text-gray-500 flex justify-between">
        <div>
          Lines: {lineCount} | Characters: {content.length}
        </div>
        <div>
          {hasChanges ? 'Modified' : 'Saved'} | Press Ctrl+S to save
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
