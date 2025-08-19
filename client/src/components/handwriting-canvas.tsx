import { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PenTool, Eraser, Undo, Search } from "lucide-react";
import { useHandwriting } from "@/hooks/use-handwriting";

interface Point {
  x: number;
  y: number;
  time: number;
}

interface HandwritingCanvasProps {
  onRecognitionResult: (results: any) => void;
}

export default function HandwritingCanvas({ onRecognitionResult }: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [realTimeRecognition, setRealTimeRecognition] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);

  const { recognizeHandwriting, isRecognizing } = useHandwriting({
    onResult: onRecognitionResult,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Set drawing styles
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#1976D2";
  }, []);

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0, time: Date.now() };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      time: Date.now(),
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setShowInstructions(false);
    
    const point = getCanvasPoint(e);
    setCurrentStroke([point]);
    
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const point = getCanvasPoint(e);
    setCurrentStroke(prev => [...prev, point]);
    
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
    }
    
    if (currentStroke.length > 0) {
      setStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke([]);
      
      // Trigger real-time recognition if enabled
      if (realTimeRecognition) {
        setTimeout(() => {
          handleRecognize();
        }, 1000);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setStrokes([]);
      setCurrentStroke([]);
      setShowInstructions(true);
    }
  };

  const undoStroke = () => {
    if (strokes.length === 0) return;
    
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    
    // Redraw canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (newStrokes.length === 0) {
        setShowInstructions(true);
        return;
      }
      
      newStrokes.forEach(stroke => {
        if (stroke.length > 0) {
          ctx.beginPath();
          ctx.moveTo(stroke[0].x, stroke[0].y);
          stroke.forEach(point => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
        }
      });
    }
  };

  const handleRecognize = async () => {
    if (strokes.length === 0) {
      alert("Please write something first!");
      return;
    }
    
    await recognizeHandwriting(strokes);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <PenTool className="text-medical-primary mr-2" />
            Write Here
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              className="flex items-center space-x-1"
            >
              <Eraser className="w-4 h-4" />
              <span>Clear</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={undoStroke}
              className="flex items-center space-x-1"
            >
              <Undo className="w-4 h-4" />
              <span>Undo</span>
            </Button>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <canvas
            ref={canvasRef}
            className="w-full h-64 cursor-crosshair rounded-lg bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          
          {/* Overlay Instructions */}
          {showInstructions && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <PenTool className="mx-auto text-4xl mb-2" />
                <p className="text-sm">Write medicine name here</p>
              </div>
            </div>
          )}
        </div>

        {/* Recognition Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="realtime"
              checked={realTimeRecognition}
              onCheckedChange={(checked) => setRealTimeRecognition(checked === true)}
            />
            <label htmlFor="realtime" className="text-sm text-gray-700">
              Real-time recognition
            </label>
          </div>
          <Button
            onClick={handleRecognize}
            disabled={isRecognizing || strokes.length === 0}
            className="bg-medical-primary hover:bg-blue-700"
          >
            {isRecognizing ? (
              <>
                <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                Processing...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Recognize
              </>
            )}
          </Button>
        </div>

        {/* Recognition Status */}
        {isRecognizing && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center">
              <div className="animate-spin w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full" />
              <span className="text-sm text-blue-800">Processing handwriting...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
