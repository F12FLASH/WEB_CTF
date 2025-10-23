// server/db.ts - COMPLETE HARDCODE
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from "@shared/schema";

console.log('🚀 Using hardcoded DATABASE_URL');

// 🔥 COMPLETE HARDCODE
const DATABASE_URL = "postgresql://neondb_owner:npg_U1ySBcv2eGqr@ep-square-silence-ad2mp4tq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });

console.log('✅ Database connection initialized');