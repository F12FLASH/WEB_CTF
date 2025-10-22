import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, LogIn, Lock, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/admin/login", credentials);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "Welcome back, admin!",
      });
      // Reload page to reset app state completely
      window.location.href = "/admin";
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative overflow-hidden">
      {/* Animated background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-float" 
             style={{ animationDelay: "0s" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-chart-3/20 rounded-full blur-3xl animate-float" 
             style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-chart-5/20 rounded-full blur-3xl animate-float" 
             style={{ animationDelay: "4s" }} />
      </div>

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-background/95 shadow-2xl border-2 animate-scale-in">
        <CardHeader className="space-y-6 text-center pb-4">
          {/* Animated shield icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative rounded-full bg-gradient-to-br from-primary via-chart-3 to-chart-5 p-6 animate-rotate-slow">
                <Shield className="h-12 w-12 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-primary via-chart-3 to-chart-5 bg-clip-text text-transparent">
              Admin Portal
            </h1>
            <p className="text-muted-foreground">
              Secure access to platform management
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field */}
            <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <label className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Username
              </label>
              <div className="relative group">
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loginMutation.isPending}
                  data-testid="input-admin-username"
                  className="pl-4 pr-4 h-12 transition-all duration-300 group-hover:border-primary/50"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <label className="text-sm font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Password
              </label>
              <div className="relative group">
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginMutation.isPending}
                  data-testid="input-admin-password"
                  className="pl-4 pr-4 h-12 transition-all duration-300 group-hover:border-primary/50"
                />
              </div>
            </div>

            {/* Login button */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <Button
                type="submit"
                className="w-full h-12 gap-2 text-base font-semibold bg-gradient-to-r from-primary via-chart-3 to-chart-5 hover:opacity-90 transition-all duration-300 hover:shadow-lg"
                disabled={loginMutation.isPending || !username.trim() || !password}
                data-testid="button-admin-login"
              >
                {loginMutation.isPending ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Access Admin Panel
                  </>
                )}
              </Button>
            </div>
          </form>
          
          {/* Info note */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 via-chart-3/5 to-chart-5/5 border border-primary/20 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Security Notice:</strong> This is a protected area. Admin credentials are managed by the system administrator. Unauthorized access attempts are logged and monitored.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
