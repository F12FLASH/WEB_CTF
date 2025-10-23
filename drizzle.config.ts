// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import path from "path";

// // Load environment variables từ file server/.env
// config({ path: path.resolve(__dirname, "server/.env") });


// Hoặc nếu file .env ở cùng thư mục với drizzle.config.ts:
 config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});