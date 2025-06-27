
import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Play, X, Trash2 } from 'lucide-react';
import { apiService, CommandOutput } from '../services/api';

interface TerminalProps {
  onClose: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ onClose }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandOutput[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to WebSocket for real-time command output
    const ws = new WebSocket('ws://localhost:5000');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'command_output') {
        setHistory(prev => [...prev, data.output]);
        setIsExecuting(false);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = async () => {
    if (!command.trim() || isExecuting) return;

    setIsExecuting(true);
    
    try {
      await apiService.executeCommand(command);
      setCommand('');
    } catch (error) {
      console.error('Command execution failed:', error);
      setIsExecuting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand();
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const commonCommands = [
    'npm install',
    'npm start',
    'npm run build',
    'python --version',
    'node --version',
    'ls -la',
    'pwd'
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900 text-green-400 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Terminal</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearHistory}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
          >
            <X className="w-3 h-3" />
            Close
          </button>
        </div>
      </div>

      {/* Common Commands */}
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="text-xs text-gray-400 mb-2">Quick Commands:</div>
        <div className="flex flex-wrap gap-1">
          {commonCommands.map((cmd) => (
            <button
              key={cmd}
              onClick={() => setCommand(cmd)}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-auto p-4 space-y-2"
      >
        {history.map((output, index) => (
          <div key={index} className="space-y-1">
            <div className="text-blue-400">
              $ {output.command}
            </div>
            {output.stdout && (
              <pre className="text-green-400 whitespace-pre-wrap">
                {output.stdout}
              </pre>
            )}
            {output.stderr && (
              <pre className="text-red-400 whitespace-pre-wrap">
                {output.stderr}
              </pre>
            )}
            {output.error && (
              <pre className="text-red-500 whitespace-pre-wrap">
                Error: {output.error}
              </pre>
            )}
            <div className="text-gray-500 text-xs">
              {new Date(output.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isExecuting && (
          <div className="flex items-center gap-2 text-yellow-400">
            <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
            Executing command...
          </div>
        )}
      </div>

      {/* Command Input */}
      <div className="flex items-center gap-2 p-4 bg-gray-800 border-t border-gray-700">
        <span className="text-blue-400">$</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter command..."
          className="flex-1 bg-transparent text-green-400 border-none outline-none"
          disabled={isExecuting}
        />
        <button
          onClick={executeCommand}
          disabled={!command.trim() || isExecuting}
          className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded"
        >
          <Play className="w-3 h-3" />
          Run
        </button>
      </div>
    </div>
  );
};

export default Terminal;
