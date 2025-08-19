import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { databaseStorage } from "./database";
import { handwritingRecognitionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Handwriting recognition endpoint
  app.post("/api/recognize", async (req, res) => {
    const startTime = Date.now();
    try {
      const { strokes } = handwritingRecognitionSchema.parse(req.body);
      
      // Mock Google Handwriting Recognition API call
      // In production, this would call the actual Google API
      const mockCandidates = [
        { text: "Augmentin", confidence: 0.95 },
        { text: "Azithral", confidence: 0.78 },
        { text: "Amoxicillin", confidence: 0.65 }
      ];
      
      // Find medicine matches using optimized database storage
      const matches = await databaseStorage.findMedicineMatches(mockCandidates);
      
      const duration = Date.now() - startTime;
      console.log(`Recognition completed in ${duration}ms`);
      
      res.json({
        candidates: mockCandidates,
        matches,
        _meta: { duration }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Recognition error after ${duration}ms:`, error);
      res.status(500).json({ 
        message: "Failed to process handwriting recognition",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Manual medicine search with performance monitoring
  app.get("/api/medicines/search", async (req, res) => {
    const startTime = Date.now();
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.json({ medicines: [], _meta: { duration: 0, cached: false } });
      }
      
      const medicines = await databaseStorage.searchMedicines(query);
      const duration = Date.now() - startTime;
      
      console.log(`Search for "${query}" completed in ${duration}ms, found ${medicines.length} results`);
      
      res.json({ 
        medicines, 
        _meta: { 
          duration, 
          count: medicines.length,
          query: query.substring(0, 50) // Truncate for logging
        } 
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Search error after ${duration}ms:`, error);
      res.status(500).json({ 
        message: "Failed to search medicines",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get database statistics with caching
  app.get("/api/statistics", async (req, res) => {
    const startTime = Date.now();
    try {
      const statistics = await databaseStorage.getStatistics();
      const duration = Date.now() - startTime;
      
      console.log(`Statistics fetched in ${duration}ms`);
      
      res.json({
        ...statistics,
        _meta: { duration }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Statistics error after ${duration}ms:`, error);
      res.status(500).json({ 
        message: "Failed to get statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
