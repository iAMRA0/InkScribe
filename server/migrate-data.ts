import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { medicines } from "@shared/schema";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = neon(connectionString);
const db = drizzle(client);

interface CSVMedicine {
  id: string;
  _id: string;
  manufacturer_name: string;
  name: string;
  rx_required: string | null;
  short_composition: string | null;
  slug: string | null;
  brand_name: string | null;
  power: string | null;
  category: string | null;
  mg_id: number | null;
  internal_id: number | null;
}

function parseCSVLine(line: string): string[] {
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

async function createIndexes() {
  console.log("Creating database indexes for optimal search performance...");
  
  try {
    // Create indexes for fast text search
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_name_gin 
      ON medicines USING gin(to_tsvector('english', name))
    `);
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_brand_name_gin 
      ON medicines USING gin(to_tsvector('english', brand_name))
    `);
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_manufacturer_gin 
      ON medicines USING gin(to_tsvector('english', manufacturer_name))
    `);
    
    // Create B-tree indexes for exact matches and sorting
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_name_btree 
      ON medicines (LOWER(name))
    `);
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_brand_name_btree 
      ON medicines (LOWER(brand_name))
    `);
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_category 
      ON medicines (category)
    `);
    
    // Create trigram indexes for fuzzy matching
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_name_trgm 
      ON medicines USING gin(name gin_trgm_ops)
    `);
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_brand_name_trgm 
      ON medicines USING gin(brand_name gin_trgm_ops)
    `);
    
    console.log("Database indexes created successfully!");
  } catch (error) {
    console.error("Error creating indexes:", error);
    throw error;
  }
}

async function loadMedicinesFromCSV() {
  console.log("Loading medicines from CSV...");
  
  try {
    const csvPath = path.resolve(process.cwd(), "attached_assets", "new_allmedicine_1755609052961.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    
    const lines = csvContent.split("\n");
    const header = lines[0].split(",");
    
    console.log(`Processing ${lines.length - 1} medicine records...`);
    
    const batchSize = 1000;
    let processed = 0;
    
    for (let i = 1; i < lines.length; i += batchSize) {
      const batch: CSVMedicine[] = [];
      
      for (let j = i; j < Math.min(i + batchSize, lines.length); j++) {
        const line = lines[j].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        if (values.length < header.length) continue;
        
        try {
          const medicine: CSVMedicine = {
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
            batch.push(medicine);
          }
        } catch (error) {
          console.warn(`Error parsing medicine row ${j}:`, error);
        }
      }
      
      if (batch.length > 0) {
        await db.insert(medicines).values(batch).onConflictDoNothing();
        processed += batch.length;
        console.log(`Processed ${processed} medicines...`);
      }
    }
    
    console.log(`Successfully loaded ${processed} medicines into database!`);
  } catch (error) {
    console.error("Error loading medicines from CSV:", error);
    throw error;
  }
}

async function main() {
  try {
    console.log("Starting database migration...");
    
    // Check if data already exists
    const existingCount = await db.select({ count: sql<number>`count(*)` }).from(medicines);
    
    if (existingCount[0]?.count > 0) {
      console.log(`Database already contains ${existingCount[0].count} medicines. Skipping data load.`);
    } else {
      await loadMedicinesFromCSV();
    }
    
    await createIndexes();
    
    console.log("Database migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main as migrateData };