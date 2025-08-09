import { useCallback, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  useReactFlow,
  ReactFlowProvider,
  Node,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CustomNode from './CustomNode';
import FloatingControls from './FloatingControls';
import MiniMapComponent from './MiniMapComponent';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Canvas, CanvasNode, CanvasEdge } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { LogOut } from 'lucide-react';
import CanvasSidebar from '../sidebar/CanvasSidebar';

const nodeTypes = {
  custom: CustomNode,
};

const edgeOptions = {
  animated: true,
  style: {
    strokeDasharray: '5,5',
    stroke: '#64748B',
    strokeWidth: 2,
  },
};

const colors = [
  '#2563EB', // primary blue
  '#10B981', // emerald
  '#F59E0B', // amber  
  '#8B5CF6', // violet
  '#EF4444', // red
  '#06B6D4', // cyan
];

interface CanvasFlowComponentProps {
  canvasId: number;
}

let nodeIdCounter = 1;
let edgeIdCounter = 1;

function CanvasFlowInner({ canvasId }: CanvasFlowComponentProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const { fitView, getZoom, setCenter, setViewport } = useReactFlow();
  const [zoom, setZoom] = useState(1);

  // Load specific canvas data
  const { data: canvas, isLoading } = useQuery<Canvas>({
    queryKey: ['/api/canvases', canvasId],
    enabled: !!canvasId,
  });

  // Load canvas when data changes
  useEffect(() => {
    if (canvas) {
      loadCanvas(canvas);
    }
  }, [canvas]);

  // Handler functions
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const handleUpdateNode = useCallback((nodeId: string, data: { title: string; description: string }) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    );
  }, [setNodes]);

  const loadCanvas = useCallback((canvas: Canvas) => {
    const flowNodes = canvas.nodes.map((node: CanvasNode) => ({
      id: node.id,
      type: 'custom',
      position: node.position,
      data: {
        ...node.data,
        canvasId: canvas.id,
        onDelete: handleDeleteNode,
        onUpdate: handleUpdateNode,
      },
      // Ensure nodes are draggable and selectable
      draggable: true,
      selectable: true,
    }));

    const flowEdges = canvas.edges.map((edge: CanvasEdge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'default',
      ...edgeOptions,
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
    
    if (canvas.viewport) {
      setCenter(canvas.viewport.x, canvas.viewport.y);
      setZoom(canvas.viewport.zoom);
    }

    // Update counters to avoid ID conflicts
    const maxNodeId = canvas.nodes.reduce((max, node) => {
      const num = parseInt(node.id.replace('node-', ''));
      return num > max ? num : max;
    }, 0);
    nodeIdCounter = maxNodeId + 1;

    const maxEdgeId = canvas.edges.reduce((max, edge) => {
      const num = parseInt(edge.id.replace('edge-', ''));
      return num > max ? num : max;
    }, 0);
    edgeIdCounter = maxEdgeId + 1;
  }, [handleDeleteNode, handleUpdateNode, setNodes, setEdges, setCenter, setZoom]);

  // Save canvas mutation
  const saveCanvasMutation = useMutation({
    mutationFn: async (canvasData: { nodes: CanvasNode[]; edges: CanvasEdge[]; viewport: any }) => {
      if (canvasId) {
        return apiRequest('PATCH', `/api/canvases/${canvasId}`, canvasData);
      } else {
        const response = await apiRequest('POST', '/api/canvases', {
          title: 'New Canvas',
          ...canvasData,
        });
        const newCanvas = await response.json();
        setCanvasId(newCanvas.id);
        return response;
      }
    },
    onSuccess: () => {
      // Only invalidate canvas list, not the current canvas to avoid refetch loops
      queryClient.invalidateQueries({ queryKey: ['/api/canvases'], exact: true });
    },
  });

  // Auto-save functionality with caching to prevent excessive calls
  const saveCanvas = useCallback(() => {
    if (saveCanvasMutation.isPending) return; // Prevent concurrent saves

    const canvasNodes: CanvasNode[] = nodes.map(node => ({
      id: node.id,
      type: node.type || 'custom',
      position: node.position,
      data: {
        title: node.data.title,
        description: node.data.description,
        color: node.data.color,
        width: node.data.width,
      },
    }));

    const canvasEdges: CanvasEdge[] = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'default',
    }));

    const viewport = {
      x: 0,
      y: 0,
      zoom: getZoom(),
    };

    saveCanvasMutation.mutate({ 
      nodes: canvasNodes, 
      edges: canvasEdges, 
      viewport 
    });
  }, [nodes, edges, getZoom, saveCanvasMutation]);

  // Auto-save when nodes or edges change (debounced)
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const timeoutId = setTimeout(saveCanvas, 3000); // Increased debounce to 3 seconds
      return () => clearTimeout(timeoutId);
    }
  }, [nodes, edges, saveCanvas]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        id: `edge-${edgeIdCounter++}`,
        ...params,
        ...edgeOptions,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const handleNewNode = useCallback(() => {
    const id = `node-${nodeIdCounter++}`;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const newNode: Node = {
      id,
      type: 'custom',
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: {
        title: 'What is the best way to learn programming?',
        description: '',
        color,
        canvasId: canvasId,
        onDelete: handleDeleteNode,
        onUpdate: handleUpdateNode,
      },
      // Ensure new nodes are draggable and selectable
      draggable: true,
      selectable: true,
    };

    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, canvasId, handleDeleteNode, handleUpdateNode]);

  const handleBranch = useCallback(() => {
    if (selectedNodes.length !== 1) {
      toast({
        title: "Select a node first",
        description: "Please select exactly one node to branch from.",
        variant: "destructive",
      });
      return;
    }

    const parentNode = nodes.find(n => n.id === selectedNodes[0]);
    if (!parentNode) return;

    const childId = `node-${nodeIdCounter++}`;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const childNode: Node = {
      id: childId,
      type: 'custom',
      position: { 
        x: parentNode.position.x + 250, 
        y: parentNode.position.y + Math.random() * 100 - 50 
      },
      data: {
        title: 'Tell me more about this topic',
        description: '',
        color,
        canvasId: canvasId,
        onDelete: handleDeleteNode,
        onUpdate: handleUpdateNode,
      },
    };

    const newEdge: Edge = {
      id: `edge-${edgeIdCounter++}`,
      source: parentNode.id,
      target: childId,
      ...edgeOptions,
    };

    setNodes((nds) => [...nds, childNode]);
    setEdges((eds) => [...eds, newEdge]);
  }, [selectedNodes, nodes, setNodes, setEdges, toast, canvasId, handleDeleteNode, handleUpdateNode]);

  const handleZoomIn = useCallback(() => {
    const currentZoom = getZoom();
    const newZoom = Math.min(currentZoom * 1.2, 2);
    setViewport({ x: 0, y: 0, zoom: newZoom });
    setZoom(newZoom);
  }, [getZoom, setViewport]);

  const handleZoomOut = useCallback(() => {
    const currentZoom = getZoom();
    const newZoom = Math.max(currentZoom * 0.8, 0.1);
    setViewport({ x: 0, y: 0, zoom: newZoom });
    setZoom(newZoom);
  }, [getZoom, setViewport]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.1 });
  }, [fitView]);

  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    setSelectedNodes(selectedNodes.map(n => n.id));
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      queryClient.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      queryClient.clear();
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    const currentZoom = getZoom();
    if (typeof currentZoom === 'number') {
      setZoom(currentZoom);
    }
  }, [getZoom]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-2 border-slate-300 px-4 py-3 flex justify-between items-center z-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {/* BrAIn Map Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-800 flex items-center justify-center">
                <svg 
                  className="w-5 h-5 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wide">
                Br<span className="text-slate-800">AI</span>n Map
              </h1>
            </div>
            <div className="h-6 w-px bg-slate-300"></div>
            <div className="text-sm text-slate-500">{user?.name}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <div className="w-2 h-2 bg-accent rounded-full" />
            <span>
              {saveCanvasMutation.isPending ? 'Saving...' : 'Auto-saved'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Canvas Container with Sidebar */}
      <div className="flex-1 flex">
        <CanvasSidebar currentCanvasId={canvasId} onCanvasSelect={() => {}} />
        
        <div ref={reactFlowWrapper} className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          className="bg-slate-100"
        >
          <Background 
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            className="bg-slate-100"
          />
          <Controls showInteractive={false} />
        </ReactFlow>

        <FloatingControls
          onNewNode={handleNewNode}
          onBranch={handleBranch}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          zoomLevel={zoom}
          canBranch={selectedNodes.length === 1}
        />

        <MiniMapComponent />

        {/* Status Bar */}
        <div className="absolute bottom-4 left-4 bg-white border-2 border-slate-300 shadow-sm px-3 py-2 z-30">
          <div className="flex items-center space-x-4 text-xs text-slate-700 font-semibold uppercase tracking-wide">
            <span>{nodes.length} nodes</span>
            <span>{edges.length} connections</span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function CanvasFlow({ canvasId }: CanvasFlowComponentProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner canvasId={canvasId} />
    </ReactFlowProvider>
  );
}
