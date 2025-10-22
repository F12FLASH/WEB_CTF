import bcrypt from "bcrypt";
import { storage } from "../storage";

const SALT_ROUNDS = 12;

/**
 * Authentication service with secure password handling
 */
export class AuthService {
  /**
   * Hash a plain text password securely
   */
  static async hashPassword(plainPassword: string): Promise<string> {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hash);
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters long" };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "Password must contain at least one number" };
    }
    return { valid: true };
  }
}
