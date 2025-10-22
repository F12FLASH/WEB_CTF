import { apiRequest } from "@/lib/queryClient";
import type { Challenge, InsertChallenge, RegisterUser, LoginUser } from "@shared/schema";

/**
 * API Service for type-safe API calls
 */
export class ApiService {
  // Auth endpoints
  static async register(data: RegisterUser) {
    return apiRequest("POST", "/api/auth/register", data);
  }

  static async login(data: LoginUser) {
    return apiRequest("POST", "/api/auth/login", data);
  }

  static async logout() {
    return apiRequest("POST", "/api/auth/logout", {});
  }

  static async getCurrentUser() {
    return apiRequest("GET", "/api/auth/user");
  }

  // Challenge endpoints
  static async getAllChallenges() {
    return apiRequest("GET", "/api/challenges");
  }

  static async getChallengeById(id: string) {
    return apiRequest("GET", `/api/challenges/${id}`);
  }

  static async submitFlag(challengeId: string, flag: string) {
    return apiRequest("POST", `/api/challenges/${challengeId}/submit`, { flag });
  }

  static async getSolvedChallenges() {
    return apiRequest("GET", "/api/solved");
  }

  // Admin endpoints
  static async adminLogin(username: string, password: string) {
    return apiRequest("POST", "/api/admin/login", { username, password });
  }

  static async adminLogout() {
    return apiRequest("POST", "/api/admin/logout", {});
  }

  static async getAdminSession() {
    return apiRequest("GET", "/api/admin/session");
  }

  static async getAdminChallenges() {
    return apiRequest("GET", "/api/admin/challenges");
  }

  static async createChallenge(data: InsertChallenge) {
    return apiRequest("POST", "/api/challenges", data);
  }

  static async updateChallenge(id: string, data: InsertChallenge) {
    return apiRequest("PUT", `/api/challenges/${id}`, data);
  }

  static async deleteChallenge(id: string) {
    return apiRequest("DELETE", `/api/challenges/${id}`);
  }

  // Leaderboard
  static async getLeaderboard() {
    return apiRequest("GET", "/api/leaderboard");
  }
}
