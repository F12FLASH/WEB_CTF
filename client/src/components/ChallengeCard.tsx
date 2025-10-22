import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Lock, Terminal } from "lucide-react";
import type { Challenge } from "@shared/schema";

interface ChallengeCardProps {
  challenge: Challenge;
  isSolved?: boolean;
  index?: number;
}

const difficultyConfig = {
  easy: { color: "bg-chart-1 text-primary-foreground", label: "Easy" },
  medium: { color: "bg-chart-3 text-primary-foreground", label: "Medium" },
  hard: { color: "bg-chart-5 text-primary-foreground", label: "Hard" },
};

const categoryIcons: Record<string, React.ReactNode> = {
  web: <Terminal className="h-3 w-3" />,
  crypto: <Lock className="h-3 w-3" />,
  forensics: <Terminal className="h-3 w-3" />,
  reverse: <Terminal className="h-3 w-3" />,
  binary: <Terminal className="h-3 w-3" />,
};

export function ChallengeCard({ challenge, isSolved = false, index = 0 }: ChallengeCardProps) {
  const difficulty = challenge.difficulty.toLowerCase() as keyof typeof difficultyConfig;
  const diffConfig = difficultyConfig[difficulty] || difficultyConfig.medium;

  return (
    <Card 
      className="hover-elevate transition-all duration-300 h-full flex flex-col group hover:shadow-lg animate-scale-in" 
      data-testid={`card-challenge-${challenge.id}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1 text-xs transition-all duration-300 group-hover:opacity-90">
              {categoryIcons[challenge.category.toLowerCase()]}
              {challenge.category}
            </Badge>
            <Badge className={`${diffConfig.color} text-xs transition-all duration-300 group-hover:opacity-90`}>
              {diffConfig.label}
            </Badge>
          </div>
          <h3 className="font-serif font-semibold text-lg leading-tight transition-colors duration-300 group-hover:text-primary" data-testid={`text-title-${challenge.id}`}>
            {challenge.title}
          </h3>
        </div>
        {isSolved ? (
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md animate-pulse" />
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 relative animate-bounce-slow" data-testid={`icon-solved-${challenge.id}`} />
          </div>
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 transition-all duration-300 group-hover:text-primary group-hover:opacity-80" data-testid={`icon-unsolved-${challenge.id}`} />
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3 transition-colors duration-300 group-hover:text-foreground" data-testid={`text-description-${challenge.id}`}>
          {challenge.description}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-4 pt-4">
        <div className="flex items-center gap-2 transition-opacity duration-300 group-hover:opacity-90">
          <span className="text-2xl font-bold text-primary font-mono" data-testid={`text-points-${challenge.id}`}>
            {challenge.points}
          </span>
          <span className="text-sm text-muted-foreground">pts</span>
        </div>
        <Link href={`/challenge/${challenge.id}`} data-testid={`link-view-${challenge.id}`}>
          <Button size="sm" className="transition-all duration-300 hover:opacity-90">
            View Challenge
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
