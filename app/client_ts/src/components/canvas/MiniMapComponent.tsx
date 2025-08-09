import { MiniMap } from '@xyflow/react';

export default function MiniMapComponent() {
  return (
    <div className="absolute bottom-4 right-4 w-48 h-32 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden z-30">
      <div className="text-xs text-slate-500 p-2 border-b border-slate-200">Mini Map</div>
      <MiniMap
        nodeColor={(node) => (node.data as any)?.color || '#64748B'}
        className="bg-slate-50"
        maskColor="rgba(59, 130, 246, 0.1)"
      />
    </div>
  );
}
