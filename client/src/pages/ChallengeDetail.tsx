import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { CheckCircle2, XCircle, ArrowLeft, Terminal, Trophy, LogIn, Shield } from "lucide-react";
import type { ChallengeWithRelations } from "@shared/schema";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const difficultyConfig = {
  easy: { color: "bg-chart-1 text-primary-foreground", label: "Easy" },
  medium: { color: "bg-chart-3 text-primary-foreground", label: "Medium" },
  hard: { color: "bg-chart-5 text-primary-foreground", label: "Hard" },
};

export function ChallengeDetail() {
  const [, params] = useRoute("/challenge/:id");
  const challengeId = params?.id;
  const [flag, setFlag] = useState("");
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { isAdmin } = useAdminAuth();

  const { data: challenge, isLoading } = useQuery<ChallengeWithRelations>({
    queryKey: ["/api/challenges", challengeId],
    enabled: !!challengeId,
  });

  const { data: solvedChallenges } = useQuery<string[]>({
    queryKey: ["/api/solved"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (challengeId && challenge) {
      const trackAnalytics = async () => {
        try {
          const getDeviceType = () => {
            const ua = navigator.userAgent;
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
              return "tablet";
            }
            if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
              return "mobile";
            }
            return "desktop";
          };

          await apiRequest("POST", "/api/analytics/challenge-access", {
            challengeId,
            playerId: user?.id || null,
            userAgent: navigator.userAgent,
            deviceType: getDeviceType(),
            referrer: document.referrer || null,
          });
        } catch (error) {
          console.error("Analytics tracking failed:", error);
        }
      };

      trackAnalytics();
    }
  }, [challengeId, challenge, user]);

  const submitMutation = useMutation({
    mutationFn: async (submittedFlag: string) => {
      const res = await apiRequest("POST", `/api/challenges/${challengeId}/submit`, {
        flag: submittedFlag,
      });
      return await res.json();
    },
    onSuccess: (data: { correct: boolean; message: string }) => {
      if (data.correct) {
        toast({
          title: "Correct Flag!",
          description: `You earned ${challenge?.points} points!`,
          variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/solved"] });
        queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
        setFlag("");
      } else {
        toast({
          title: "Incorrect Flag",
          description: "Try again! Double-check your flag format.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim()) return;
    submitMutation.mutate(flag);
  };

  const isSolved = challenge && solvedChallenges?.includes(challenge.id);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Challenge Not Found</h2>
            <p className="text-muted-foreground mb-6">This challenge does not exist or has been removed.</p>
            <Link href="/">
              <Button>Back to Challenges</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const difficulty = challenge.difficulty.slug as keyof typeof difficultyConfig;
  const diffConfig = difficultyConfig[difficulty] || difficultyConfig.medium;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/" data-testid="link-back">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Challenges
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="gap-1">
                      <Terminal className="h-3 w-3" />
                      {challenge.category.name}
                    </Badge>
                    <Badge className={diffConfig.color}>
                      {challenge.difficulty.name}
                    </Badge>
                    {isSolved && (
                      <Badge className="bg-primary text-primary-foreground gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Solved
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-serif font-bold" data-testid="text-challenge-title">
                    {challenge.title}
                  </h1>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold font-mono text-primary" data-testid="text-challenge-points">
                        {challenge.points}
                      </span>
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-3">Description</h2>
                  <MarkdownRenderer 
                    content={challenge.description} 
                    data-testid="text-challenge-description"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardHeader>
              <h2 className="text-lg font-semibold">Submit Flag</h2>
              <p className="text-sm text-muted-foreground">
                Enter the flag you found to earn points
              </p>
            </CardHeader>
            <CardContent>
              {isAdmin ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Admin Account</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Admins cannot submit flags. Please register a player account to participate in challenges.
                  </p>
                  <Link href="/register">
                    <Button variant="default">Create Player Account</Button>
                  </Link>
                </div>
              ) : !isAuthenticated ? (
                <div className="text-center py-8">
                  <LogIn className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Login Required</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please login or register to submit flags
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Link href="/login">
                      <Button variant="default">Login</Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="outline">Register</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Flag
                    </label>
                    <Input
                      type="text"
                      placeholder="flag{...}"
                      value={flag}
                      onChange={(e) => setFlag(e.target.value)}
                      className="font-mono"
                      disabled={isSolved || submitMutation.isPending}
                      data-testid="input-flag"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSolved || submitMutation.isPending || !flag.trim()}
                    data-testid="button-submit-flag"
                  >
                    {submitMutation.isPending ? "Checking..." : isSolved ? "Already Solved" : "Submit Flag"}
                  </Button>
                  {user && (
                    <p className="text-xs text-muted-foreground text-center">
                      Submitting as <strong>{user.username}</strong>
                    </p>
                  )}
                </form>
              )}

              {isSolved && (
                <div className="mt-4 p-4 rounded-md bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Challenge Completed!</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    You've already solved this challenge.
                  </p>
                </div>
              )}

              <div className="mt-6 p-4 rounded-md bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground">
                  <strong>Hint:</strong> Flags typically follow the format flag{"{"}...{"}"}. Make sure to include the entire flag including the braces.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
