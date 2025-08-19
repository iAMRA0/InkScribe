interface Point {
  x: number;
  y: number;
  time: number;
}

interface RecognitionResult {
  candidates: Array<{
    text: string;
    confidence: number;
  }>;
  matches: Array<{
    medicine: {
      id: string;
      name: string;
      brand_name: string | null;
      manufacturer_name: string;
      short_composition: string | null;
      category: string | null;
      rx_required: string | null;
    };
    matchScore: number;
    matchedField: string;
  }>;
}

export async function recognizeHandwriting(strokes: Point[][]): Promise<RecognitionResult> {
  try {
    const response = await fetch("/api/recognize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ strokes }),
    });

    if (!response.ok) {
      throw new Error(`Recognition failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Handwriting recognition error:", error);
    throw new Error("Failed to recognize handwriting. Please try again.");
  }
}

export async function searchMedicines(query: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/medicines/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.medicines || [];
  } catch (error) {
    console.error("Medicine search error:", error);
    throw new Error("Failed to search medicines. Please try again.");
  }
}
