import { Switch, Route } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Canvas from "@/pages/canvas";
import Login from "@/pages/login";
import NodeDetail from "@/pages/node-detail";
import NotFound from "@/pages/not-found";

function Router() {
  const [currentCanvasId, setCurrentCanvasId] = useState<number | undefined>();
  console.log('Router component rendering');

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/canvas/:canvasId/node/:nodeId" component={NodeDetail} />
      <Route path="/canvas/:canvasId">
        <ProtectedRoute>
          <Canvas onCanvasLoad={setCurrentCanvasId} />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <Canvas onCanvasLoad={setCurrentCanvasId} />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log('App component rendering');
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
