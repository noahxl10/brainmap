import { useParams } from "wouter";
import { useEffect } from "react";
import CanvasFlow from "@/components/canvas/CanvasFlow";

interface CanvasProps {
  onCanvasLoad?: (canvasId: number) => void;
}

export default function Canvas({ onCanvasLoad }: CanvasProps) {
  const { canvasId } = useParams<{ canvasId?: string }>();
  const id = canvasId ? parseInt(canvasId) : 1;

  useEffect(() => {
    onCanvasLoad?.(id);
  }, [id, onCanvasLoad]);

  return <CanvasFlow canvasId={id} />;
}
