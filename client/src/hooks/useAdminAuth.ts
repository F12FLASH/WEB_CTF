import { useQuery } from "@tanstack/react-query";

export function useAdminAuth() {
  const { data: session, isLoading } = useQuery<{
    authenticated: boolean;
    admin?: { id: string; username: string };
  }>({
    queryKey: ["/api/admin/session"],
    retry: false,
  });

  return {
    isAdmin: session?.authenticated || false,
    admin: session?.admin,
    isLoading,
  };
}
