import { useQuery } from "@tanstack/react-query";
import { ChallengeCard } from "@/components/ChallengeCard";
import { AnnouncementPopup } from "@/components/AnnouncementPopup";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, Trophy } from "lucide-react";
import type { ChallengeWithRelations } from "@shared/schema";
import { useState } from "react";

export function ChallengeList() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  const { data: challenges, isLoading } = useQuery<ChallengeWithRelations[]>({
    queryKey: ["/api/challenges"],
  });

  const { data: solvedChallenges } = useQuery<string[]>({
    queryKey: ["/api/solved"],
  });

  const categories = ["all", "web", "crypto", "forensics", "reverse", "binary"];
  const difficulties = ["all", "easy", "medium", "hard"];

  const filteredChallenges = challenges?.filter((challenge) => {
    const categoryMatch = selectedCategory === "all" || challenge.category.slug === selectedCategory;
    const difficultyMatch = selectedDifficulty === "all" || challenge.difficulty.slug === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const solvedCount = solvedChallenges?.length || 0;
  const totalCount = challenges?.length || 0;
  const totalPoints = challenges?.reduce((sum, c) => sum + c.points, 0) || 0;
  const earnedPoints = challenges
    ?.filter((c) => solvedChallenges?.includes(c.id))
    .reduce((sum, c) => sum + c.points, 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AnnouncementPopup />
      <div>
        <h1 className="text-4xl font-serif font-bold mb-2">Challenges</h1>
        <p className="text-muted-foreground">
          Test your skills across various cybersecurity domains
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Challenges Solved</p>
                <p className="text-3xl font-bold font-mono" data-testid="text-solved-count">
                  {solvedCount}/{totalCount}
                </p>
              </div>
              <Trophy className="h-10 w-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Points Earned</p>
                <p className="text-3xl font-bold font-mono text-primary" data-testid="text-earned-points">
                  {earnedPoints}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                of {totalPoints}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Progress</p>
                <p className="text-3xl font-bold font-mono">
                  {totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0}%
                </p>
              </div>
              <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${totalCount > 0 ? (solvedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Filters</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    data-testid={`button-filter-category-${category}`}
                    className="capitalize"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Difficulty</p>
              <div className="flex flex-wrap gap-2">
                {difficulties.map((difficulty) => (
                  <Button
                    key={difficulty}
                    variant={selectedDifficulty === difficulty ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDifficulty(difficulty)}
                    data-testid={`button-filter-difficulty-${difficulty}`}
                    className="capitalize"
                  >
                    {difficulty}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredChallenges && filteredChallenges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge, index) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              isSolved={solvedChallenges?.includes(challenge.id)}
              index={index}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No challenges found matching your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
