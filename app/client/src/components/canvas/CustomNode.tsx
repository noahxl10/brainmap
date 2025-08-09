import { memo, useState, useEffect } from 'react';
import * as React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { X, Send, Loader2, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CustomNodeData {
  title: string; // This is now the prompt
  description: string; // This is now the AI response
  color: string;
  canvasId?: number;
  isGenerating?: boolean;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, data: { title: string; description: string }) => void;
}

function CustomNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as CustomNodeData;
  const [prompt, setPrompt] = useState(nodeData.title || '');
  const [response, setResponse] = useState(nodeData.description || '');
  const [isMinimized, setIsMinimized] = useState(false);
  const [, setLocation] = useLocation();

  // AI response generation mutation
  const generateResponseMutation = useMutation({
    mutationFn: async (promptText: string) => {
      const response = await apiRequest('POST', '/api/ai/generate', { prompt: promptText });
      const data = await response.json();
      return data.response;
    },
    onSuccess: (aiResponse: string) => {
      setResponse(aiResponse);
      nodeData.onUpdate?.(id, { title: prompt, description: aiResponse });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to generate AI response';
      setResponse(`Error: ${errorMessage}`);
      nodeData.onUpdate?.(id, { title: prompt, description: `Error: ${errorMessage}` });
    },
  });

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    nodeData.onUpdate?.(id, { title: value, description: response });
  };

  const handleGenerateResponse = () => {
    if (!prompt.trim()) return;
    
    setResponse('Generating AI response...');
    nodeData.onUpdate?.(id, { title: prompt, description: 'Generating AI response...' });
    generateResponseMutation.mutate(prompt.trim());
  };

  const handlePromptKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateResponse();
    }
  };

  const handleDelete = () => {
    nodeData.onDelete?.(id);
  };

  const handleOpenDetail = () => {
    const canvasId = nodeData.canvasId || 1; // fallback to canvas 1 if not provided
    setLocation(`/canvas/${canvasId}/node/${id}`);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const borderColor = selected ? 'border-primary' : 'border-slate-200';
  const borderWidth = selected ? 'border-2' : 'border-2';
  
  const nodeWidth = 280; // Fixed width

  if (isMinimized) {
    return (
      <div 
        className={`bg-white ${borderWidth} ${borderColor} shadow-sm w-[140px] cursor-pointer hover:shadow-md transition-all duration-200 border-l-4`}
        style={{ borderLeftColor: nodeData.color || '#64748B' }}
      >
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div 
                className="w-2 h-2 bg-current" 
                style={{ color: nodeData.color || '#64748B' }}
              />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">AI</span>
            </div>
            <div className="flex items-center space-x-0">
              <button 
                onClick={toggleMinimize}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Expand node"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
              <button 
                onClick={handleDelete}
                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete node"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-medium truncate border-l-2 border-slate-300 pl-2" title={prompt}>
              {prompt || 'No prompt'}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                {response ? 'Ready' : 'Empty'}
              </span>
              <button
                onClick={handleOpenDetail}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Open detail view"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <Handle type="target" position={Position.Left} className="w-2 h-2" />
        <Handle type="source" position={Position.Right} className="w-2 h-2" />
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-none ${borderWidth} ${borderColor} shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 relative border-l-4`}
      style={{ 
        width: `${nodeWidth}px`,
        borderLeftColor: nodeData.color || '#64748B'
      }}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div 
              className="w-2 h-2 bg-current" 
              style={{ color: nodeData.color || '#64748B' }}
            />
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">AI</span>
          </div>
          <div className="flex items-center space-x-0">
            <button
              onClick={handleOpenDetail}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Open detail view"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
            <button 
              onClick={toggleMinimize}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Minimize node"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
            <button 
              onClick={handleDelete}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete node"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          {/* Prompt Input */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1 uppercase tracking-wide">Input</label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                onKeyPress={handlePromptKeyPress}
                className="w-full text-sm text-slate-800 bg-white border-2 border-slate-200 px-3 py-2 outline-none resize-none placeholder-slate-400 focus:border-slate-400 transition-colors"
                placeholder="Enter your prompt..."
                rows={Math.max(2, Math.ceil(prompt.length / 24))}
                style={{ height: 'auto' }}
              />
              <button
                onClick={handleGenerateResponse}
                disabled={!prompt.trim() || generateResponseMutation.isPending}
                className="absolute bottom-2 right-2 p-1.5 bg-slate-800 text-white disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors"
                title="Generate AI response (Enter)"
              >
                {generateResponseMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
          
          {/* AI Response */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1 uppercase tracking-wide">Output</label>
            <div className="bg-slate-50 border-2 border-slate-200 p-3 min-h-[60px]">
              {response ? (
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                  {response}
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  AI response will appear here...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>



      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
}

export default memo(CustomNode);
