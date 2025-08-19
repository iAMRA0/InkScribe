import { useState, useCallback } from "react";
import { recognizeHandwriting } from "@/lib/handwriting-api";
import { useToast } from "@/hooks/use-toast";

interface Point {
  x: number;
  y: number;
  time: number;
}

interface UseHandwritingProps {
  onResult: (results: any) => void;
}

export function useHandwriting({ onResult }: UseHandwritingProps) {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const { toast } = useToast();

  const recognize = useCallback(async (strokes: Point[][]) => {
    if (strokes.length === 0) {
      toast({
        title: "No Input",
        description: "Please write something first!",
        variant: "destructive",
      });
      return;
    }

    setIsRecognizing(true);
    
    try {
      const results = await recognizeHandwriting(strokes);
      onResult(results);
      
      toast({
        title: "Recognition Complete",
        description: `Found ${results.matches.length} medicine matches`,
      });
    } catch (error) {
      console.error("Recognition failed:", error);
      toast({
        title: "Recognition Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsRecognizing(false);
    }
  }, [onResult, toast]);

  return {
    recognizeHandwriting: recognize,
    isRecognizing,
  };
}
