import { Switch, Route } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import CanvasSidebar from "@/components/sidebar/CanvasSidebar";
import Canvas from "@/pages/canvas";
import Login from "@/pages/login";
import NodeDetail from "@/pages/node-detail";
import NotFound from "@/pages/not-found";

function Router() {
  const [currentCanvasId, setCurrentCanvasId] = useState<number | undefined>();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/canvas/:canvasId/node/:nodeId" component={NodeDetail} />
      <Route path="/canvas/:canvasId">
        <ProtectedRoute>
          <div className="flex h-screen">
            <CanvasSidebar 
              currentCanvasId={currentCanvasId}
              onCanvasSelect={setCurrentCanvasId}
            />
            <div className="flex-1">
              <Canvas onCanvasLoad={setCurrentCanvasId} />
            </div>
          </div>
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <div className="flex h-screen">
            <CanvasSidebar 
              currentCanvasId={currentCanvasId}
              onCanvasSelect={setCurrentCanvasId}
            />
            <div className="flex-1">
              <Canvas onCanvasLoad={setCurrentCanvasId} />
            </div>
          </div>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
