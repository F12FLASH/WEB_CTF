import { Link, useLocation } from "wouter";
import { Flag, Trophy, Shield, Menu, X, LogIn, UserPlus, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SiteInfo {
  siteName: string;
  siteDescription: string;
  contactEmail?: string;
  enableRegistration?: string;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { isAdmin, admin } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: siteInfo } = useQuery<SiteInfo>({
    queryKey: ["/api/site-info"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Universal logout - destroys both admin and user sessions
      await apiRequest("POST", "/api/logout", {});
    },
    onSuccess: () => {
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
      // Reload page to completely reset app state
      window.location.href = "/";
    },
  });

  const baseNavItems = [
    { path: "/", label: "Challenges", icon: Flag },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  // Show admin menu if user is authenticated as admin (not regular user)
  const navItems = (isAdmin && !isAuthenticated)
    ? [...baseNavItems, { path: "/admin", label: "Admin", icon: Shield }]
    : baseNavItems;

  // Check if user is logged in (either as regular user or admin)
  const isLoggedIn = isAuthenticated || isAdmin;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md animate-slide-down">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" data-testid="link-home">
              <div className="flex items-center gap-3 hover-elevate active-elevate-2 rounded-md px-3 py-2 -ml-3 group transition-all duration-300">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary via-chart-3 to-chart-5 group-hover:opacity-90 transition-opacity duration-300">
                  <Flag className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-lg font-bold tracking-tight group-hover:text-primary transition-colors duration-300">
                    {siteInfo?.siteName || "CTF Platform"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {siteInfo?.siteDescription || "Capture The Flag"}
                  </span>
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path} data-testid={`link-${item.label.toLowerCase()}`}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="gap-2 transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 text-sm animate-fade-in" style={{ animationDelay: "0.3s" }}>
                    {isAuthenticated && user ? (
                      <>
                        <User className="h-4 w-4 text-primary animate-pulse-slow" />
                        <span className="font-medium">{user.username}</span>
                        <span className="text-muted-foreground">({user.score} pts)</span>
                      </>
                    ) : isAdmin && admin ? (
                      <>
                        <Shield className="h-4 w-4 text-primary animate-pulse-slow" />
                        <span className="font-medium">{admin.username}</span>
                        <span className="text-xs text-muted-foreground">(Admin)</span>
                      </>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    className="gap-2 transition-all duration-300 hover:text-destructive hover:opacity-90 animate-fade-in"
                    style={{ animationDelay: "0.4s" }}
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="gap-2 transition-all duration-300 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                      <LogIn className="h-4 w-4" />
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="default" className="gap-2 transition-all duration-300 bg-gradient-to-r from-primary to-chart-3 hover:opacity-90 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                      <UserPlus className="h-4 w-4" />
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </nav>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden transition-opacity duration-300 hover:opacity-70"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border py-4 animate-slide-down">
              <nav className="flex flex-col gap-2">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  return (
                    <Link key={item.path} href={item.path} data-testid={`link-mobile-${item.label.toLowerCase()}`}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className="w-full justify-start gap-2 transition-all duration-300 hover:opacity-90 animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
                
                <div className="border-t border-border my-2" />
                
                {isLoggedIn ? (
                  <>
                    <div className="px-4 py-2 text-sm">
                      {isAuthenticated && user ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{user.username}</span>
                          <span className="text-muted-foreground">({user.score} pts)</span>
                        </div>
                      ) : isAdmin && admin ? (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="font-medium">{admin.username}</span>
                          <span className="text-xs text-muted-foreground">(Admin)</span>
                        </div>
                      ) : null}
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 transition-all duration-300 hover:text-destructive hover:opacity-90"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logoutMutation.mutate();
                      }}
                      disabled={logoutMutation.isPending}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start gap-2 transition-all duration-300 hover:opacity-90"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LogIn className="h-4 w-4" />
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button 
                        variant="default" 
                        className="w-full justify-start gap-2 transition-all duration-300 hover:opacity-90"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <UserPlus className="h-4 w-4" />
                        Register
                      </Button>
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 animate-fade-in">
        {children}
      </main>

      <footer className="border-t border-border py-6 mt-12 animate-fade-in">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2025 {siteInfo?.siteName || "CTF Platform"}. {siteInfo?.siteDescription || "Test your cybersecurity skills."}</p>
            <p className="font-mono">Flag format: flag{"{"}...{"}"}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
