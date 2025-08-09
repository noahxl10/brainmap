import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Canvas } from '@shared/schema';

export default function NodeDetail() {
  const { canvasId, nodeId } = useParams<{ canvasId: string; nodeId: string }>();
  const [, setLocation] = useLocation();

  const { data: canvas, isLoading } = useQuery<Canvas>({
    queryKey: ['/api/canvases', canvasId],
    enabled: !!canvasId,
  });

  const node = canvas?.nodes?.find(n => n.id === nodeId);

  const handleGoBack = () => {
    setLocation('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading node...</p>
        </div>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Node Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">The requested node could not be found.</p>
            <Button onClick={handleGoBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Canvas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
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
            <h1 className="text-xl font-bold text-slate-800">
              Br<span className="text-purple-600">AI</span>n Map
            </h1>
          </div>
        </div>
        
        <Button 
          onClick={handleGoBack}
          variant="outline"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Canvas
        </Button>
      </header>

      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Node Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Node ID</h3>
                <p className="text-slate-900 font-mono text-sm bg-slate-100 px-3 py-2 rounded">
                  {node.id}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Node Text</h3>
                <div className="bg-white border border-slate-200 rounded-lg p-6 min-h-32">
                  <p className="text-lg leading-relaxed text-slate-900 whitespace-pre-wrap">
                    {node.data?.title || node.data?.description || 'No text content'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Position</h3>
                  <p className="text-slate-700 text-sm">
                    X: {Math.round(node.position.x)}, Y: {Math.round(node.position.y)}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Type</h3>
                  <p className="text-slate-700 text-sm capitalize">
                    {node.type || 'default'}
                  </p>
                </div>
              </div>
              
              {node.data?.color && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Color</h3>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded border border-slate-200"
                      style={{ backgroundColor: node.data.color }}
                    />
                    <span className="text-slate-700 font-mono text-sm">
                      {node.data.color}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}