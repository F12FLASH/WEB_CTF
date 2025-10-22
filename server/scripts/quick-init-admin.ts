import { storage } from "../storage";
import { AuthService } from "../services/auth.service";

/**
 * Quick script to create admin user with default credentials
 * Run with: npx tsx server/scripts/quick-init-admin.ts
 */
async function quickInitAdmin() {
  try {
    console.log("=== Quick Admin Setup ===\n");

    const username = "admin";
    const password = "Admin123!@#"; // Strong default password

    // Check if admin already exists
    const existingAdmin = await storage.getAdminByUsername(username);
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log("Username: admin");
      console.log("If you forgot the password, delete the admin and run this script again.");
      process.exit(0);
    }

    // Create admin with hashed password
    await storage.createAdmin({
      username,
      passwordHash: await AuthService.hashPassword(password),
    });

    console.log("✅ Admin user created successfully!");
    console.log("\n--- Admin Credentials ---");
    console.log("Username: admin");
    console.log("Password: Admin123!@#");
    console.log("\n⚠️  IMPORTANT: Change this password after first login!");
    console.log("------------------------\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

quickInitAdmin();
