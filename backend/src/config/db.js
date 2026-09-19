import "dotenv/config";
import { neon } from "@neondatabase/serverless";


export const sql = neon(process.env.DATABASE_URL);

export async function initDB() {
    try {
        await sql`
      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        streak INT DEFAULT 0,
        last_completed DATE,
        created_at DATE NOT NULL DEFAULT CURRENT_DATE
      );
    `;
        console.log("Database initialized successfully");
    } catch (error) {
        console.log("Error initializing DB", error);
        process.exit(1);
    }
}