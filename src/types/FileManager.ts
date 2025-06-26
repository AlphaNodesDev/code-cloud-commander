
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  content?: string;
  lastModified: number;
}

export interface FileManagerState {
  files: FileNode[];
  currentFile: FileNode | null;
  selectedPath: string;
  searchQuery: string;
}
