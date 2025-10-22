import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  score: number;
  solvedCount: number;
}

export function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-700" />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-black">1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-black">2nd</Badge>;
    if (rank === 3) return <Badge className="bg-amber-700 text-white">3rd</Badge>;
    return <span className="text-muted-foreground font-mono text-sm">#{rank}</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-64" />
        <Card>
          <CardContent className="p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20 ml-auto" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-serif font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          Top players ranked by total points earned
        </p>
      </div>

      {leaderboard && leaderboard.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leaderboard.slice(0, 3).map((entry) => (
              <Card
                key={entry.playerId}
                className={`${
                  entry.rank === 1
                    ? "border-yellow-500/50 bg-yellow-500/5"
                    : entry.rank === 2
                    ? "border-gray-400/50 bg-gray-400/5"
                    : "border-amber-700/50 bg-amber-700/5"
                }`}
                data-testid={`card-top-${entry.rank}`}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    {getRankIcon(entry.rank)}
                  </div>
                  <h3 className="font-semibold text-lg mb-1" data-testid={`text-username-${entry.rank}`}>
                    {entry.username}
                  </h3>
                  <p className="text-3xl font-bold font-mono text-primary mb-1" data-testid={`text-score-${entry.rank}`}>
                    {entry.score}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entry.solvedCount} challenges solved
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">All Rankings</h2>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-sm">Rank</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Player</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm">Solved</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <tr
                        key={entry.playerId}
                        className={`border-b border-border/50 hover-elevate ${
                          index % 2 === 0 ? "bg-muted/20" : ""
                        }`}
                        data-testid={`row-player-${entry.playerId}`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {getRankIcon(entry.rank)}
                            {getRankBadge(entry.rank)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium" data-testid={`text-username-${entry.playerId}`}>
                            {entry.username}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-muted-foreground" data-testid={`text-solved-${entry.playerId}`}>
                            {entry.solvedCount}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-mono font-bold text-primary" data-testid={`text-score-${entry.playerId}`}>
                            {entry.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No Scores Yet</h2>
            <p className="text-muted-foreground">
              Be the first to solve challenges and claim the top spot!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
