import { db } from "../db";
import { pool } from "../db";
import * as fs from "fs";
import * as path from "path";

async function exportSQLDump() {
  try {
    console.log("🔄 Exporting database to SQL...");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const exportDir = path.join(process.cwd(), "exports");
    
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const tables = ["challenges", "players", "submissions", "admin_users", "announcements", "sessions"];
    let sqlDump = `-- CTF Platform Database Export
-- Generated: ${new Date().toISOString()}
-- PostgreSQL Database Dump

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

`;

    for (const tableName of tables) {
      try {
        const schemaResult = await pool.query(`
          SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position;
        `, [tableName]);

        if (schemaResult.rows.length === 0) continue;

        sqlDump += `\n-- Table: ${tableName}\n`;
        sqlDump += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
        
        const dataResult = await pool.query(`SELECT * FROM ${tableName}`);
        
        if (dataResult.rows.length > 0) {
          const columns = Object.keys(dataResult.rows[0]);
          
          for (const row of dataResult.rows) {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (typeof val === 'number') return val.toString();
              if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
              if (val instanceof Date) return `'${val.toISOString()}'`;
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              return `'${String(val).replace(/'/g, "''")}'`;
            });

            sqlDump += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
        }

        console.log(`✓ Exported table: ${tableName} (${dataResult.rows.length} rows)`);
      } catch (tableError) {
        console.warn(`⚠️  Skipped table ${tableName}: ${tableError}`);
      }
    }

    const sqlFile = path.join(exportDir, `ctf-export-${timestamp}.sql`);
    fs.writeFileSync(sqlFile, sqlDump);

    console.log(`\n✅ SQL export successful: ${sqlFile}`);
    return sqlFile;
  } catch (error) {
    console.error("❌ SQL export failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

exportSQLDump()
  .then(() => {
    console.log("✅ Export completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Export error:", error);
    process.exit(1);
  });
