import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { medicines } from "@shared/schema";
import { sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.log("DATABASE_URL not found, using in-memory storage");
  process.exit(0);
}

const client = neon(connectionString);
const db = drizzle(client);

export async function initializeDatabase() {
  try {
    console.log("Checking database connection...");
    
    // Test database connection
    await db.execute(sql`SELECT 1`);
    console.log("Database connection successful");
    
    // Check if medicines table exists and has data
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'medicines'
      );
    `);
    
    if (!tableExists[0]?.exists) {
      console.log("Medicines table does not exist. Please run 'npm run db:setup' first.");
      return false;
    }
    
    const medicineCount = await db.select({ count: sql<number>`count(*)` }).from(medicines);
    console.log(`Database contains ${medicineCount[0]?.count || 0} medicines`);
    
    if ((medicineCount[0]?.count || 0) === 0) {
      console.log("No medicines found in database. Please run 'npm run db:migrate' to load data.");
      return false;
    }
    
    // Check if indexes exist
    const indexes = await db.execute(sql`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'medicines' 
      AND indexname LIKE 'idx_medicines_%';
    `);
    
    console.log(`Found ${indexes.length} performance indexes`);
    
    return true;
  } catch (error) {
    console.error("Database initialization failed:", error);
    return false;
  }
}

// Auto-initialize if run directly
if (require.main === module) {
  initializeDatabase().then((success) => {
    process.exit(success ? 0 : 1);
  });
}