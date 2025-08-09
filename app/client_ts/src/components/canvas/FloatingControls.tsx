import { Plus, GitBranch, ZoomIn, ZoomOut, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingControlsProps {
  onNewNode: () => void;
  onBranch: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  zoomLevel: number;
  canBranch: boolean;
}

export default function FloatingControls({
  onNewNode,
  onBranch,
  onZoomIn,
  onZoomOut,
  onFitView,
  zoomLevel,
  canBranch
}: FloatingControlsProps) {
  return (
    <div className="absolute top-4 left-4 z-40 flex flex-col space-y-2">
      {/* Primary Actions */}
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-2 flex flex-col space-y-2">
        <Button
          onClick={onNewNode}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Node</span>
        </Button>
        
        <Button
          onClick={onBranch}
          disabled={!canBranch}
          variant="secondary"
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium"
          size="sm"
        >
          <GitBranch className="w-4 h-4" />
          <span>Branch</span>
        </Button>
      </div>
      
      {/* Zoom Controls */}
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-2 flex flex-col space-y-1">
        <Button
          onClick={onZoomIn}
          variant="ghost"
          size="sm"
          className="p-2"
        >
          <Plus className="w-4 h-4" />
        </Button>
        
        <div className="text-xs text-center text-slate-500 py-1">
          {Math.round(zoomLevel * 100)}%
        </div>
        
        <Button
          onClick={onZoomOut}
          variant="ghost"
          size="sm"
          className="p-2"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        
        <hr className="border-slate-200 my-1" />
        
        <Button
          onClick={onFitView}
          variant="ghost"
          size="sm"
          className="p-2"
        >
          <Expand className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
