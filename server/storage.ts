import { type User, type InsertUser, type Medicine, type InsertMedicine, type MedicineMatch } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Medicine operations
  getAllMedicines(): Promise<Medicine[]>;
  searchMedicines(query: string): Promise<Medicine[]>;
  loadMedicinesFromCSV(): Promise<void>;
  findMedicineMatches(candidates: Array<{ text: string; confidence: number }>): Promise<MedicineMatch[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private medicines: Map<string, Medicine>;
  private medicineSearchIndex: Map<string, Medicine[]>;

  constructor() {
    this.users = new Map();
    this.medicines = new Map();
    this.medicineSearchIndex = new Map();
    this.loadMedicinesFromCSV();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllMedicines(): Promise<Medicine[]> {
    return Array.from(this.medicines.values());
  }

  async searchMedicines(query: string): Promise<Medicine[]> {
    const normalizedQuery = query.toLowerCase().trim();
    if (normalizedQuery.length < 2) return [];

    const results = new Set<Medicine>();
    
    // Search in name, brand_name, and manufacturer_name
    for (const medicine of this.medicines.values()) {
      if (
        medicine.name.toLowerCase().includes(normalizedQuery) ||
        (medicine.brand_name && medicine.brand_name.toLowerCase().includes(normalizedQuery)) ||
        medicine.manufacturer_name.toLowerCase().includes(normalizedQuery)
      ) {
        results.add(medicine);
      }
    }

    return Array.from(results).slice(0, 50); // Limit results
  }

  async loadMedicinesFromCSV(): Promise<void> {
    try {
      const csvPath = path.resolve(process.cwd(), "attached_assets", "new_allmedicine_1755609052961.csv");
      const csvContent = fs.readFileSync(csvPath, "utf-8");
      
      const lines = csvContent.split("\n");
      const header = lines[0].split(",");
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = this.parseCSVLine(line);
        if (values.length < header.length) continue;
        
        try {
          const medicine: Medicine = {
            id: randomUUID(),
            _id: values[1] || "",
            manufacturer_name: values[2] || "",
            name: values[3] || "",
            rx_required: values[4] || null,
            short_composition: values[5] || null,
            slug: values[6] || null,
            brand_name: values[7] || null,
            power: values[8] || null,
            category: values[9] || null,
            mg_id: values[10] ? parseInt(values[10]) : null,
            internal_id: values[11] ? parseInt(values[11]) : null,
          };
          
          if (medicine.name) {
            this.medicines.set(medicine.id, medicine);
            this.indexMedicine(medicine);
          }
        } catch (error) {
          console.warn(`Error parsing medicine row ${i}:`, error);
        }
      }
      
      console.log(`Loaded ${this.medicines.size} medicines from CSV`);
    } catch (error) {
      console.error("Error loading medicines from CSV:", error);
    }
  }

  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i - 1] === ",")) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private indexMedicine(medicine: Medicine): void {
    const words = [
      ...medicine.name.toLowerCase().split(/\s+/),
      ...(medicine.brand_name ? medicine.brand_name.toLowerCase().split(/\s+/) : []),
    ];
    
    for (const word of words) {
      if (word.length >= 2) {
        if (!this.medicineSearchIndex.has(word)) {
          this.medicineSearchIndex.set(word, []);
        }
        this.medicineSearchIndex.get(word)!.push(medicine);
      }
    }
  }

  async findMedicineMatches(candidates: Array<{ text: string; confidence: number }>): Promise<MedicineMatch[]> {
    const matches: MedicineMatch[] = [];
    const processedMedicines = new Set<string>();

    for (const candidate of candidates) {
      const candidateMatches = await this.searchMedicines(candidate.text);
      
      for (const medicine of candidateMatches) {
        if (processedMedicines.has(medicine.id)) continue;
        processedMedicines.add(medicine.id);

        const nameScore = this.calculateSimilarity(candidate.text, medicine.name);
        const brandScore = medicine.brand_name ? 
          this.calculateSimilarity(candidate.text, medicine.brand_name) : 0;
        
        const maxScore = Math.max(nameScore, brandScore);
        
        if (maxScore > 0.6) { // Minimum similarity threshold
          matches.push({
            medicine: {
              id: medicine.id,
              name: medicine.name,
              brand_name: medicine.brand_name,
              manufacturer_name: medicine.manufacturer_name,
              short_composition: medicine.short_composition,
              category: medicine.category,
              rx_required: medicine.rx_required,
            },
            matchScore: maxScore,
            matchedField: nameScore > brandScore ? "name" : "brand_name",
          });
        }
      }
    }

    // Sort by match score and candidate confidence
    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // Limit to top 10 matches
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Levenshtein distance implementation
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1.0;
    
    const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    
    for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const distance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return maxLength === 0 ? 1.0 : 1.0 - distance / maxLength;
  }
}

export const storage = new MemStorage();
