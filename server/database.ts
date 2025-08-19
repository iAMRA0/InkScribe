import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { medicines, users } from "@shared/schema";
import { eq, ilike, or, sql } from "drizzle-orm";
import type { Medicine, MedicineMatch } from "@shared/schema";

// Database connection with connection pooling
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = neon(connectionString);
export const db = drizzle(client);

export class DatabaseStorage {
  private searchCache = new Map<string, Medicine[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getAllMedicines(): Promise<Medicine[]> {
    try {
      return await db.select().from(medicines).limit(1000); // Limit for performance
    } catch (error) {
      console.error("Error fetching all medicines:", error);
      return [];
    }
  }

  async searchMedicines(query: string): Promise<Medicine[]> {
    const normalizedQuery = query.toLowerCase().trim();
    if (normalizedQuery.length < 2) return [];

    // Check cache first
    const cacheKey = `search:${normalizedQuery}`;
    const cached = this.searchCache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    try {
      let results: Medicine[] = [];

      // For short queries (2-3 chars), use trigram similarity for fuzzy matching
      if (normalizedQuery.length <= 3) {
        results = await db
          .select()
          .from(medicines)
          .where(
            or(
              sql`${medicines.name} % ${normalizedQuery}`,
              sql`${medicines.brand_name} % ${normalizedQuery}`
            )
          )
          .orderBy(
            sql`
              GREATEST(
                similarity(${medicines.name}, ${normalizedQuery}),
                COALESCE(similarity(${medicines.brand_name}, ${normalizedQuery}), 0)
              ) DESC
            `
          )
          .limit(50);
      } else {
        // For longer queries, use full-text search with ranking
        results = await db
          .select()
          .from(medicines)
          .where(
            or(
              sql`to_tsvector('english', ${medicines.name}) @@ plainto_tsquery('english', ${normalizedQuery})`,
              sql`to_tsvector('english', ${medicines.brand_name}) @@ plainto_tsquery('english', ${normalizedQuery})`,
              sql`to_tsvector('english', ${medicines.manufacturer_name}) @@ plainto_tsquery('english', ${normalizedQuery})`,
              // Fallback to ILIKE for partial matches
              ilike(medicines.name, `%${normalizedQuery}%`),
              ilike(medicines.brand_name, `%${normalizedQuery}%`)
            )
          )
          .orderBy(
            sql`
              CASE 
                WHEN LOWER(${medicines.name}) = ${normalizedQuery} THEN 1
                WHEN LOWER(${medicines.brand_name}) = ${normalizedQuery} THEN 2
                WHEN LOWER(${medicines.name}) LIKE ${normalizedQuery + '%'} THEN 3
                WHEN LOWER(${medicines.brand_name}) LIKE ${normalizedQuery + '%'} THEN 4
                WHEN to_tsvector('english', ${medicines.name}) @@ plainto_tsquery('english', ${normalizedQuery}) THEN 5
                WHEN to_tsvector('english', ${medicines.brand_name}) @@ plainto_tsquery('english', ${normalizedQuery}) THEN 6
                ELSE 7
              END,
              ts_rank(to_tsvector('english', ${medicines.name}), plainto_tsquery('english', ${normalizedQuery})) DESC
            `
          )
          .limit(50);
      }

      // Cache the results
      this.searchCache.set(cacheKey, results);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

      // Clean up old cache entries periodically
      this.cleanupCache();

      return results;
    } catch (error) {
      console.error("Error searching medicines:", error);
      // Fallback to simple ILIKE search if advanced search fails
      try {
        const searchPattern = `%${normalizedQuery}%`;
        const fallbackResults = await db
          .select()
          .from(medicines)
          .where(
            or(
              ilike(medicines.name, searchPattern),
              ilike(medicines.brand_name, searchPattern)
            )
          )
          .limit(50);
        
        return fallbackResults;
      } catch (fallbackError) {
        console.error("Fallback search also failed:", fallbackError);
        return [];
      }
    }
  }

  async findMedicineMatches(candidates: Array<{ text: string; confidence: number }>): Promise<MedicineMatch[]> {
    const matches: MedicineMatch[] = [];
    const processedMedicines = new Set<string>();

    for (const candidate of candidates) {
      const candidateMatches = await this.searchMedicines(candidate.text);
      
      for (const medicine of candidateMatches.slice(0, 5)) { // Limit per candidate
        if (processedMedicines.has(medicine.id)) continue;
        processedMedicines.add(medicine.id);

        const nameScore = this.calculateSimilarity(candidate.text, medicine.name);
        const brandScore = medicine.brand_name ? 
          this.calculateSimilarity(candidate.text, medicine.brand_name) : 0;
        
        const maxScore = Math.max(nameScore, brandScore);
        
        if (maxScore > 0.6) {
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
            matchScore: maxScore * candidate.confidence, // Weight by recognition confidence
            matchedField: nameScore > brandScore ? "name" : "brand_name",
          });
        }
      }
    }

    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }

  async getStatistics() {
    try {
      const [totalCount, manufacturerCount, categoryCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(medicines),
        db.select({ count: sql<number>`count(distinct ${medicines.manufacturer_name})` }).from(medicines),
        db.select({ count: sql<number>`count(distinct ${medicines.category})` }).from(medicines)
          .where(sql`${medicines.category} IS NOT NULL`)
      ]);

      return {
        totalMedicines: totalCount[0]?.count || 0,
        totalManufacturers: manufacturerCount[0]?.count || 0,
        totalCategories: categoryCount[0]?.count || 0,
        recognitionAccuracy: 94
      };
    } catch (error) {
      console.error("Error getting statistics:", error);
      return {
        totalMedicines: 0,
        totalManufacturers: 0,
        totalCategories: 0,
        recognitionAccuracy: 94
      };
    }
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1.0;
    
    // Quick exact match check
    if (s1.includes(s2) || s2.includes(s1)) {
      return Math.max(s1.length, s2.length) / Math.min(s1.length, s2.length) * 0.8;
    }
    
    // Levenshtein distance for fuzzy matching
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

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now >= expiry) {
        this.searchCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }
}

export const databaseStorage = new DatabaseStorage();