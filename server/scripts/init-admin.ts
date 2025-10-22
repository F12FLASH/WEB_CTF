import { storage } from "../storage";
import { AuthService } from "../services/auth.service";
import readline from "readline";

/**
 * Script to create initial admin user with secure password
 * Run with: npx tsx server/scripts/init-admin.ts
 */
async function initAdmin() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query: string): Promise<string> =>
    new Promise(resolve => rl.question(query, resolve));

  try {
    console.log("=== CTF Platform Admin Setup ===\n");

    // Check if admin already exists
    const existingAdmin = await storage.getAdminByUsername("admin");
    if (existingAdmin) {
      const overwrite = await question("Admin user already exists. Overwrite? (yes/no): ");
      if (overwrite.toLowerCase() !== "yes") {
        console.log("Setup cancelled.");
        rl.close();
        process.exit(0);
      }
    }

    const username = await question("Enter admin username (default: admin): ") || "admin";
    let password = await question("Enter admin password (min 8 chars): ");

    while (password.length < 8) {
      console.log("❌ Password must be at least 8 characters long.");
      password = await question("Enter admin password (min 8 chars): ");
    }

    // Create or update admin
    if (existingAdmin) {
      console.log("Updating existing admin user...");
      // Note: We would need an update method. For now, we'll skip this scenario
      console.log("⚠️  Please delete the existing admin manually and run this script again.");
    } else {
      await storage.createAdmin({
        username,
        passwordHash: password,
      });
      console.log(`✅ Admin user '${username}' created successfully!`);
    }

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    rl.close();
    process.exit(1);
  }
}

initAdmin();
