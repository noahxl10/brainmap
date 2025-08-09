import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, FileText, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Canvas {
  id: number;
  title: string;
  userId: number;
  nodes: any[];
  edges: any[];
  viewport: { x: number; y: number; zoom: number };
}

interface CanvasSidebarProps {
  currentCanvasId?: number;
  onCanvasSelect: (canvasId: number) => void;
}

export default function CanvasSidebar({ currentCanvasId, onCanvasSelect }: CanvasSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCanvasTitle, setNewCanvasTitle] = useState('');
  const [, setLocation] = useLocation();

  // Fetch all canvases
  const { data: canvases = [], isLoading } = useQuery<Canvas[]>({
    queryKey: ['/api/canvases'],
  });

  // Create new canvas mutation
  const createCanvasMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest('POST', '/api/canvases', {
        title,
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      });
      return response.json();
    },
    onSuccess: (newCanvas: Canvas) => {
      queryClient.invalidateQueries({ queryKey: ['/api/canvases'] });
      setIsCreating(false);
      setNewCanvasTitle('');
      onCanvasSelect(newCanvas.id);
      setLocation(`/canvas/${newCanvas.id}`);
    },
  });

  const handleCreateCanvas = () => {
    if (!newCanvasTitle.trim()) return;
    createCanvasMutation.mutate(newCanvasTitle.trim());
  };

  const handleCanvasClick = (canvas: Canvas) => {
    onCanvasSelect(canvas.id);
    setLocation(`/canvas/${canvas.id}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateCanvas();
    }
    if (e.key === 'Escape') {
      setIsCreating(false);
      setNewCanvasTitle('');
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-slate-100 border-r-2 border-slate-300 h-full flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        
        <div className="flex-1 flex flex-col items-center space-y-2 mt-4">
          {canvases.map((canvas) => (
            <button
              key={canvas.id}
              onClick={() => handleCanvasClick(canvas)}
              className={`w-8 h-8 border-2 flex items-center justify-center transition-colors ${
                currentCanvasId === canvas.id 
                  ? 'bg-white text-slate-800 border-slate-800' 
                  : 'bg-slate-200 text-slate-600 hover:bg-white border-slate-400'
              }`}
              title={canvas.title}
            >
              <FileText className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-slate-50 border-r-2 border-slate-300 h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b-2 border-slate-300 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="bg-slate-800 text-white px-3 py-1 text-sm font-bold uppercase tracking-wider">
              BrAIn
            </div>
            <span className="text-slate-700 text-sm font-semibold uppercase tracking-wide">Map</span>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        
        {/* Create new canvas */}
        {isCreating ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newCanvasTitle}
              onChange={(e) => setNewCanvasTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter canvas title..."
              className="w-full px-3 py-2 text-sm border-2 border-slate-300 focus:outline-none focus:border-slate-500 transition-colors"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={handleCreateCanvas}
                disabled={!newCanvasTitle.trim() || createCanvasMutation.isPending}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createCanvasMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewCanvasTitle('');
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-700 border-2 border-dashed border-slate-400 hover:border-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="font-semibold uppercase tracking-wide">New Topic Canvas</span>
          </button>
        )}
      </div>

      {/* Canvas list */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center text-slate-500 text-sm py-8">
            Loading canvases...
          </div>
        ) : canvases.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">
            No canvases yet.
            <br />
            Create your first topic canvas above.
          </div>
        ) : (
          <div className="space-y-2">
            {canvases.map((canvas) => (
              <button
                key={canvas.id}
                onClick={() => handleCanvasClick(canvas)}
                className={`w-full p-3 text-left border-2 transition-colors ${
                  currentCanvasId === canvas.id
                    ? 'bg-white border-slate-800 text-slate-800'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-white'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate uppercase tracking-wide">
                      {canvas.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">
                      {canvas.nodes?.length || 0} nodes
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}