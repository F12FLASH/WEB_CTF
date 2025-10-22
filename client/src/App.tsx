import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/Layout";
import { PageLoader } from "@/components/PageLoader";
import { ChallengeList } from "@/pages/ChallengeList";
import { ChallengeDetail } from "@/pages/ChallengeDetail";
import { Leaderboard } from "@/pages/Leaderboard";
import { Admin } from "@/pages/Admin";
import { AdminLogin } from "@/pages/AdminLogin";
import { Register } from "@/pages/Register";
import { Login } from "@/pages/Login";
import Install from "@/pages/Install";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";

function Router() {
  const [location, setLocation] = useLocation();
  const [installCheckDone, setInstallCheckDone] = useState(false);
  const [needsInstall, setNeedsInstall] = useState(false);
  const isAdminRoute = location.startsWith('/admin');
  const isInstallRoute = location.startsWith('/install');

  useEffect(() => {
    const checkInstallStatus = async () => {
      try {
        const res = await fetch("/api/install/check");
        const data = await res.json();
        
        if (data.needsSetup && !isInstallRoute) {
          setNeedsInstall(true);
          setLocation("/install");
        }
      } catch (error) {
        console.error("Failed to check install status:", error);
      } finally {
        setInstallCheckDone(true);
      }
    };

    if (!isInstallRoute) {
      checkInstallStatus();
    } else {
      setInstallCheckDone(true);
    }
  }, []);

  if (!installCheckDone && !isInstallRoute) {
    return <PageLoader />;
  }

  if (isInstallRoute) {
    return (
      <Switch>
        <Route path="/install" component={Install} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (isAdminRoute) {
    return (
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={ChallengeList} />
        <Route path="/challenge/:id" component={ChallengeDetail} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Show initial loading animation only once
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (initialLoading) {
    return <PageLoader />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
