import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  LogOut,
  LayoutDashboard,
  Trophy,
  Users,
  Target,
  CheckCircle2,
  Search,
  Filter,
  Menu,
  X,
  Megaphone,
  FolderTree,
  BarChart3,
  Settings as SettingsIcon,
  TrendingUp,
} from "lucide-react";
import type { Challenge, ChallengeWithRelations, InsertChallenge, Announcement, InsertAnnouncement, ChallengeCategory, InsertChallengeCategory, ChallengeDifficulty, InsertChallengeDifficulty } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChallengeSchema, insertAnnouncementSchema, insertChallengeCategorySchema, insertChallengeDifficultySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CategoriesView } from "@/components/admin/CategoriesView";
import { DifficultiesView } from "@/components/admin/DifficultiesView";
import { SettingsView } from "@/components/admin/SettingsView";
import { AnalyticsView } from "@/components/admin/AnalyticsView";

type AdminView = "dashboard" | "challenges" | "announcements" | "categories" | "difficulties" | "settings" | "analytics";

interface AdminStats {
  totalChallenges: number;
  totalPlayers: number;
  totalSubmissions: number;
  successfulSolves: number;
  challengesByCategory: Record<string, number>;
  challengesByDifficulty: Record<string, number>;
}

export function Admin() {
  const [currentView, setCurrentView] = useState<AdminView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<ChallengeWithRelations | null>(null);
  const [originalFlag, setOriginalFlag] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: session, isLoading: sessionLoading } = useQuery<{
    authenticated: boolean;
    admin?: { id: string; username: string };
  }>({
    queryKey: ["/api/admin/session"],
    retry: false,
  });

  useEffect(() => {
    if (!sessionLoading && !session?.authenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to access the admin panel",
        variant: "destructive",
      });
      setLocation("/admin/login");
    }
  }, [session, sessionLoading, setLocation, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!session?.authenticated,
  });

  const { data: challenges, isLoading: challengesLoading } = useQuery<ChallengeWithRelations[]>({
    queryKey: ["/api/admin/challenges"],
    enabled: !!session?.authenticated,
  });

  const { data: announcements, isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements/all"],
    enabled: !!session?.authenticated,
  });

  const { data: categories } = useQuery<ChallengeCategory[]>({
    queryKey: ["/api/categories"],
    enabled: !!session?.authenticated,
  });

  const { data: difficulties } = useQuery<ChallengeDifficulty[]>({
    queryKey: ["/api/difficulties"],
    enabled: !!session?.authenticated,
  });

  const form = useForm<InsertChallenge>({
    resolver: zodResolver(insertChallengeSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: categories?.[0]?.id || "",
      difficultyId: difficulties?.[0]?.id || "",
      points: 100,
      flag: "",
    },
  });

  const announcementForm = useForm<InsertAnnouncement>({
    resolver: zodResolver(insertAnnouncementSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "info",
      isActive: 1,
      createdBy: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertChallenge) => {
      return apiRequest("POST", "/api/challenges", data);
    },
    onSuccess: () => {
      toast({
        title: "Challenge Created",
        description: "New challenge has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create challenge",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; challenge: InsertChallenge }) => {
      return apiRequest("PUT", `/api/challenges/${data.id}`, data.challenge);
    },
    onSuccess: () => {
      toast({
        title: "Challenge Updated",
        description: "Challenge has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setEditingChallenge(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update challenge",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/challenges/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Challenge Deleted",
        description: "Challenge has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setDeletingId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete challenge",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/logout", {});
    },
    onSuccess: () => {
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
      window.location.href = "/admin/login";
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: InsertAnnouncement) => {
      return apiRequest("POST", "/api/announcements", data);
    },
    onSuccess: () => {
      toast({
        title: "Announcement Created",
        description: "New announcement has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setIsAnnouncementDialogOpen(false);
      announcementForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async (data: { id: string; announcement: Partial<InsertAnnouncement> }) => {
      return apiRequest("PUT", `/api/announcements/${data.id}`, data.announcement);
    },
    onSuccess: () => {
      toast({
        title: "Announcement Updated",
        description: "Announcement has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setEditingAnnouncement(null);
      announcementForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/announcements/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Announcement Deleted",
        description: "Announcement has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setDeletingAnnouncementId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertChallenge) => {
    if (editingChallenge) {
      const challengeData = {
        ...data,
        flag: data.flag.trim() || originalFlag,
      };
      updateMutation.mutate({ id: editingChallenge.id, challenge: challengeData });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (challenge: ChallengeWithRelations) => {
    setEditingChallenge(challenge);
    setOriginalFlag(challenge.flag || "");
    form.reset({
      title: challenge.title,
      description: challenge.description,
      categoryId: challenge.categoryId,
      difficultyId: challenge.difficultyId,
      points: challenge.points,
      flag: challenge.flag || "",
    });
  };

  const handleCloseDialog = () => {
    setIsCreateOpen(false);
    setEditingChallenge(null);
    setOriginalFlag("");
    form.reset();
  };

  const onAnnouncementSubmit = (data: InsertAnnouncement) => {
    if (editingAnnouncement) {
      updateAnnouncementMutation.mutate({ 
        id: editingAnnouncement.id, 
        announcement: data 
      });
    } else {
      createAnnouncementMutation.mutate(data);
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    announcementForm.reset({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      isActive: announcement.isActive,
      createdBy: announcement.createdBy,
    });
    setIsAnnouncementDialogOpen(true);
  };

  const handleCloseAnnouncementDialog = () => {
    setIsAnnouncementDialogOpen(false);
    setEditingAnnouncement(null);
    announcementForm.reset();
  };

  const filteredChallenges = useMemo(() => {
    if (!challenges) return [];
    
    return challenges.filter((challenge) => {
      const matchesSearch = challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || challenge.categoryId === categoryFilter;
      const matchesDifficulty = difficultyFilter === "all" || challenge.difficultyId === difficultyFilter;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [challenges, searchQuery, categoryFilter, difficultyFilter]);

  if (sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Shield className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    gradient 
  }: { 
    title: string; 
    value: number | string; 
    icon: any; 
    gradient: string;
  }) => (
    <Card className="overflow-hidden relative group hover:shadow-lg transition-all duration-300">
      <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity ${gradient}`} />
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <h3 className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {value}
            </h3>
          </div>
          <div className={`h-14 w-14 rounded-xl ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } transition-all duration-300 border-r bg-card/50 backdrop-blur-xl flex-shrink-0 overflow-hidden shadow-xl`}
      >
        <div className="p-6 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Admin Panel
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                {session?.admin?.username}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              currentView === "dashboard"
                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg scale-105"
                : "hover:bg-accent/50 hover:scale-102"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-semibold">Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView("challenges")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              currentView === "challenges"
                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg scale-105"
                : "hover:bg-accent/50 hover:scale-102"
            }`}
          >
            <Trophy className="h-5 w-5" />
            <span className="font-semibold">Challenges</span>
          </button>

          <button
            onClick={() => setCurrentView("announcements")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              currentView === "announcements"
                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg scale-105"
                : "hover:bg-accent/50 hover:scale-102"
            }`}
          >
            <Megaphone className="h-5 w-5" />
            <span className="font-semibold">Announcements</span>
          </button>

          <button
            onClick={() => setCurrentView("categories")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              currentView === "categories"
                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg scale-105"
                : "hover:bg-accent/50 hover:scale-102"
            }`}
          >
            <FolderTree className="h-5 w-5" />
            <span className="font-semibold">Categories</span>
          </button>

          <button
            onClick={() => setCurrentView("difficulties")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              currentView === "difficulties"
                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg scale-105"
                : "hover:bg-accent/50 hover:scale-102"
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold">Difficulties</span>
          </button>

          <button
            onClick={() => setCurrentView("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              currentView === "settings"
                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg scale-105"
                : "hover:bg-accent/50 hover:scale-102"
            }`}
          >
            <SettingsIcon className="h-5 w-5" />
            <span className="font-semibold">Settings</span>
          </button>

          <button
            onClick={() => setCurrentView("analytics")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              currentView === "analytics"
                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg scale-105"
                : "hover:bg-accent/50 hover:scale-102"
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="font-semibold">Analytics</span>
          </button>
        </nav>

        <div className="absolute bottom-0 w-72 p-4 border-t bg-card/80 backdrop-blur">
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            className="w-full gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hover:bg-primary/10"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
                  {currentView === "dashboard" ? "Dashboard" : currentView === "challenges" ? "Challenges Management" : "Announcements"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentView === "dashboard"
                    ? "Overview of your CTF platform"
                    : currentView === "challenges"
                    ? "Create, edit, and manage challenges"
                    : "Manage platform announcements"}
                </p>
              </div>
            </div>

            {currentView === "challenges" && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg hover:shadow-xl transition-all"
                data-testid="button-create-challenge"
              >
                <Plus className="h-4 w-4" />
                Add Challenge
              </Button>
            )}
            
            {currentView === "announcements" && (
              <Button
                onClick={() => setIsAnnouncementDialogOpen(true)}
                className="gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Announcement
              </Button>
            )}
          </div>
        </header>

        <div className="p-6">
          {currentView === "dashboard" && (
            <div className="space-y-6">
              {statsLoading ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-32" />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      title="Total Challenges"
                      value={stats?.totalChallenges || 0}
                      icon={Trophy}
                      gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                    />
                    <StatCard
                      title="Total Players"
                      value={stats?.totalPlayers || 0}
                      icon={Users}
                      gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
                    />
                    <StatCard
                      title="Total Submissions"
                      value={stats?.totalSubmissions || 0}
                      icon={Target}
                      gradient="bg-gradient-to-br from-purple-500 to-pink-600"
                    />
                    <StatCard
                      title="Successful Solves"
                      value={stats?.successfulSolves || 0}
                      icon={CheckCircle2}
                      gradient="bg-gradient-to-br from-green-500 to-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="overflow-hidden border-2 hover:shadow-xl transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                        <CardTitle className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-white" />
                          </div>
                          Challenges by Category
                        </CardTitle>
                        <CardDescription>Distribution across categories</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {stats?.challengesByCategory && Object.keys(stats.challengesByCategory).length > 0 ? (
                          <div className="space-y-4">
                            {Object.entries(stats.challengesByCategory).map(([category, count]) => (
                              <div key={category} className="group">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline" className="capitalize font-semibold">
                                    {category}
                                  </Badge>
                                  <span className="font-mono font-bold text-lg">{count}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 transition-all duration-500 group-hover:from-blue-600 group-hover:to-cyan-700"
                                    style={{ width: `${(count / (stats?.totalChallenges || 1)) * 100}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No challenges yet
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-2 hover:shadow-xl transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                        <CardTitle className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                            <Target className="h-4 w-4 text-white" />
                          </div>
                          Challenges by Difficulty
                        </CardTitle>
                        <CardDescription>Distribution by difficulty level</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {stats?.challengesByDifficulty && Object.keys(stats.challengesByDifficulty).length > 0 ? (
                          <div className="space-y-4">
                            {Object.entries(stats.challengesByDifficulty).map(([difficulty, count]) => {
                              const gradientClass = 
                                difficulty === "easy" ? "from-green-500 to-emerald-600 group-hover:from-green-600 group-hover:to-emerald-700" :
                                difficulty === "medium" ? "from-amber-500 to-orange-600 group-hover:from-amber-600 group-hover:to-orange-700" :
                                "from-red-500 to-rose-600 group-hover:from-red-600 group-hover:to-rose-700";
                              
                              return (
                                <div key={difficulty} className="group">
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge
                                      className={`capitalize font-semibold ${
                                        difficulty === "easy"
                                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                          : difficulty === "medium"
                                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                      }`}
                                    >
                                      {difficulty}
                                    </Badge>
                                    <span className="font-mono font-bold text-lg">{count}</span>
                                  </div>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full bg-gradient-to-r transition-all duration-500 ${gradientClass}`}
                                      style={{ width: `${(count / (stats?.totalChallenges || 1)) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No challenges yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          )}

          {currentView === "announcements" && (
            <div className="space-y-6">
              <Card className="border-2 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  {announcementsLoading ? (
                    <div className="p-6">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full mb-4" />
                      ))}
                    </div>
                  ) : announcements && announcements.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {announcements.map((announcement) => (
                          <TableRow key={announcement.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{announcement.title}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {announcement.message}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {announcement.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  announcement.isActive === 1
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-500 text-white"
                                }
                              >
                                {announcement.isActive === 1 ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {announcement.createdAt
                                ? new Date(announcement.createdAt).toLocaleDateString()
                                : "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditAnnouncement(announcement)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeletingAnnouncementId(announcement.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
                      <Megaphone className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No announcements yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first announcement to get started
                      </p>
                      <Button onClick={() => setIsAnnouncementDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Announcement
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {currentView === "challenges" && (
            <div className="space-y-6">
              <Card className="border-2 shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search challenges..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 border-2 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full md:w-48 h-11 border-2">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                      <SelectTrigger className="w-full md:w-48 h-11 border-2">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Difficulties</SelectItem>
                        {difficulties?.map((diff) => (
                          <SelectItem key={diff.id} value={diff.id}>
                            {diff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  {challengesLoading ? (
                    <div className="p-6">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full mb-4" />
                      ))}
                    </div>
                  ) : filteredChallenges && filteredChallenges.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Difficulty</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredChallenges.map((challenge) => (
                          <TableRow key={challenge.id} data-testid={`row-challenge-${challenge.id}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium" data-testid={`text-title-${challenge.id}`}>
                                  {challenge.title}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {challenge.description}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {challenge.category.name}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  challenge.difficulty.slug === "easy"
                                    ? "bg-chart-1 text-primary-foreground"
                                    : challenge.difficulty.slug === "medium"
                                    ? "bg-chart-3 text-primary-foreground"
                                    : "bg-chart-5 text-primary-foreground"
                                }
                              >
                                {challenge.difficulty.name}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono font-bold">
                                {challenge.points}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(challenge)}
                                  data-testid={`button-edit-${challenge.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeletingId(challenge.id)}
                                  data-testid={`button-delete-${challenge.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
                      <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">
                        {searchQuery || categoryFilter !== "all" || difficultyFilter !== "all"
                          ? "No challenges found"
                          : "No challenges yet"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery || categoryFilter !== "all" || difficultyFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Create your first challenge to get started"}
                      </p>
                      {!searchQuery && categoryFilter === "all" && difficultyFilter === "all" && (
                        <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Challenge
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {currentView === "categories" && <CategoriesView />}

          {currentView === "difficulties" && <DifficultiesView />}

          {currentView === "settings" && <SettingsView />}

          {currentView === "analytics" && <AnalyticsView />}
        </div>
      </main>

      <Dialog open={isCreateOpen || !!editingChallenge} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingChallenge ? "Edit Challenge" : "Create New Challenge"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Challenge title"
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Challenge description and instructions"
                        rows={6}
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficultyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-difficulty">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {difficulties?.map((diff) => (
                            <SelectItem key={diff.id} value={diff.id}>
                              {diff.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-points"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="flag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flag</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="flag{example_flag_here}"
                        className="font-mono"
                        {...field}
                        data-testid="input-flag"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingChallenge
                    ? "Update Challenge"
                    : "Create Challenge"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Challenge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this challenge? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAnnouncementDialogOpen || !!editingAnnouncement} onOpenChange={(open) => !open && handleCloseAnnouncementDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}
            </DialogTitle>
          </DialogHeader>
          <Form {...announcementForm}>
            <form onSubmit={announcementForm.handleSubmit(onAnnouncementSubmit)} className="space-y-4">
              <FormField
                control={announcementForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Announcement title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={announcementForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Announcement message"
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={announcementForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={announcementForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Active</SelectItem>
                          <SelectItem value="0">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseAnnouncementDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}
                >
                  {createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending
                    ? "Saving..."
                    : editingAnnouncement
                    ? "Update Announcement"
                    : "Create Announcement"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingAnnouncementId} onOpenChange={(open) => !open && setDeletingAnnouncementId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAnnouncementId && deleteAnnouncementMutation.mutate(deletingAnnouncementId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
