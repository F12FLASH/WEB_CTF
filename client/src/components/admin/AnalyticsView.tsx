import { useQuery } from "@tanstack/react-query";
import { BarChart3, Eye, Users, TrendingUp, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type AccessLog = {
  id: string;
  challengeId: string;
  playerId: string | null;
  visitedAt: Date;
  deviceType: string | null;
  ipAddress: string | null;
  geoCountry: string | null;
  geoRegion: string | null;
  geoCity: string | null;
  userAgent: string | null;
  referrer: string | null;
};

type AnalyticsData = {
  totalViews: number;
  uniqueVisitors: number;
  topChallenges: Array<{
    challengeId: string;
    challengeTitle: string;
    viewCount: number;
  }>;
  recentLogs: AccessLog[];
};

export function AnalyticsView() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/stats"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">Challenge access statistics and visitor insights</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalViews || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Challenge page visits
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.uniqueVisitors || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Distinct IP addresses
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Challenge</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.topChallenges?.[0]?.viewCount || 0}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {analytics?.topChallenges?.[0]?.challengeTitle || "No data"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Top Challenges</CardTitle>
              <CardDescription>Most viewed challenges</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.topChallenges && analytics.topChallenges.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Challenge</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.topChallenges.map((challenge: any, index: number) => (
                      <TableRow key={challenge.challengeId}>
                        <TableCell>
                          <Badge variant="secondary">#{index + 1}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {challenge.challengeTitle}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {challenge.viewCount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No challenge views yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest challenge page visits</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentLogs && analytics.recentLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Challenge</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.recentLogs.map((log: AccessLog) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.visitedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.challengeId.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {log.geoCity || log.geoCountry ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Globe className="h-3 w-3" />
                              {[log.geoCity, log.geoRegion, log.geoCountry]
                                .filter(Boolean)
                                .join(", ")}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.deviceType ? (
                            <Badge variant="outline">{log.deviceType}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.ipAddress || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                  <p className="text-muted-foreground">
                    Challenge views will appear here once users start visiting challenges
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
