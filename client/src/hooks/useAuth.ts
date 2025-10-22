import { useQuery } from "@tanstack/react-query";
import type { Player } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<Player>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
