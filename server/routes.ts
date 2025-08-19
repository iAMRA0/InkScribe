import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { handwritingRecognitionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Handwriting recognition endpoint
  app.post("/api/recognize", async (req, res) => {
    try {
      const { strokes } = handwritingRecognitionSchema.parse(req.body);
      
      // Mock Google Handwriting Recognition API call
      // In production, this would call the actual Google API
      const mockCandidates = [
        { text: "Augmentin", confidence: 0.95 },
        { text: "Azithral", confidence: 0.78 },
        { text: "Amoxicillin", confidence: 0.65 }
      ];
      
      // Find medicine matches
      const matches = await storage.findMedicineMatches(mockCandidates);
      
      res.json({
        candidates: mockCandidates,
        matches
      });
    } catch (error) {
      console.error("Recognition error:", error);
      res.status(500).json({ 
        message: "Failed to process handwriting recognition",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Manual medicine search
  app.get("/api/medicines/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.json({ medicines: [] });
      }
      
      const medicines = await storage.searchMedicines(query);
      res.json({ medicines });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ 
        message: "Failed to search medicines",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get database statistics
  app.get("/api/statistics", async (req, res) => {
    try {
      const allMedicines = await storage.getAllMedicines();
      const manufacturers = new Set(allMedicines.map(m => m.manufacturer_name));
      const categories = new Set(allMedicines.filter(m => m.category).map(m => m.category));
      
      res.json({
        totalMedicines: allMedicines.length,
        totalManufacturers: manufacturers.size,
        totalCategories: categories.size,
        recognitionAccuracy: 94 // Mock accuracy percentage
      });
    } catch (error) {
      console.error("Statistics error:", error);
      res.status(500).json({ 
        message: "Failed to get statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
