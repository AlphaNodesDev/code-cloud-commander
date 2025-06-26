
import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Trash2, Download } from 'lucide-react';
import { FileNode } from '../types/FileManager';

interface DirectoryTreeProps {
  files: FileNode[];
  selectedPath: string;
  onFileSelect: (file: FileNode) => void;
  onDeleteFile: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: TreeNode[];
  file?: FileNode;
}

const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  files,
  selectedPath,
  onFileSelect,
  onDeleteFile
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));

  const treeData = useMemo(() => {
    const root: TreeNode = { name: '', path: '', type: 'folder', children: [] };
    
    files.forEach(file => {
      const pathParts = file.path.split('/').filter(Boolean);
      let currentNode = root;
      
      pathParts.forEach((part, index) => {
        const currentPath = pathParts.slice(0, index + 1).join('/');
        let existingChild = currentNode.children.find(child => child.name === part);
        
        if (!existingChild) {
          existingChild = {
            name: part,
            path: currentPath,
            type: index === pathParts.length - 1 ? 'file' : 'folder',
            children: [],
            file: index === pathParts.length - 1 ? file : undefined
          };
          currentNode.children.push(existingChild);
        }
        
        currentNode = existingChild;
      });
    });

    const sortNode = (node: TreeNode) => {
      node.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortNode);
    };
    
    sortNode(root);
    return root.children;
  }, [files]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return newExpanded;
    });
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconClass = "w-4 h-4";
    
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <File className={`${iconClass} text-yellow-500`} />;
      case 'html':
      case 'htm':
        return <File className={`${iconClass} text-orange-500`} />;
      case 'css':
      case 'scss':
      case 'sass':
        return <File className={`${iconClass} text-blue-500`} />;
      case 'json':
        return <File className={`${iconClass} text-green-500`} />;
      case 'md':
        return <File className={`${iconClass} text-gray-600`} />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <File className={`${iconClass} text-purple-500`} />;
      default:
        return <File className={`${iconClass} text-gray-500`} />;
    }
  };

  const downloadFile = (file: FileNode) => {
    const blob = new Blob([file.content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedPath === node.path;
    
    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer group ${
            isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else if (node.file) {
              onFileSelect(node.file);
            }
          }}
        >
          {node.type === 'folder' && (
            <>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500" />
              )}
            </>
          )}
          
          {node.type === 'file' && (
            <>
              <div className="w-4" />
              {getFileIcon(node.name)}
            </>
          )}
          
          <span className="flex-1 truncate text-sm text-gray-700">
            {node.name}
          </span>
          
          {node.type === 'file' && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (node.file) downloadFile(node.file);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Download className="w-3 h-3 text-gray-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFile(node.path);
                }}
                className="p-1 hover:bg-red-100 rounded"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            </div>
          )}
        </div>
        
        {node.type === 'folder' && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-2">
      {treeData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No files uploaded yet</p>
        </div>
      ) : (
        treeData.map(node => renderNode(node))
      )}
    </div>
  );
};

export default DirectoryTree;
