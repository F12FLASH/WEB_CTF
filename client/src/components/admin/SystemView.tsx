import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Download,
  Upload,
  Server,
  Database,
  HardDrive,
  Activity,
  FileJson,
  FileText,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

interface SystemInfo {
  version: string;
  name: string;
  nodeVersion: string;
  platform: string;
  databaseVersion: string;
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  database: {
    challenges: number;
    players: number;
    categories: number;
    difficulties: number;
    submissions: number;
    announcements: number;
  };
}

export function SystemView() {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState<"json" | "sql" | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  const { data: systemInfo, isLoading } = useQuery<SystemInfo>({
    queryKey: ["/api/system/info"],
  });

  const exportMutation = useMutation({
    mutationFn: async (format: "json" | "sql") => {
      const res = await apiRequest("POST", `/api/system/export/${format}`, {});
      const blob = format === "json" ? await res.blob() : new Blob([await res.text()], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ctf-backup-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({ title: "Database exported successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async ({ file, overwrite }: { file: File; overwrite: boolean }) => {
      const text = await file.text();
      const isSQL = file.name.endsWith(".sql");
      
      if (isSQL) {
        const res = await apiRequest("POST", "/api/system/import/sql", { sql: text });
        return res.json();
      } else {
        const data = JSON.parse(text);
        const res = await apiRequest("POST", "/api/system/import/json", { data, overwrite });
        return res.json();
      }
    },
    onSuccess: (data) => {
      const message = data.errors 
        ? `Imported ${data.imported} items with ${data.errors.length} errors`
        : `Imported ${data.imported} items${data.skipped ? `, skipped ${data.skipped}` : ""}`;
      toast({ 
        title: "Import completed", 
        description: message,
        variant: data.errors ? "destructive" : "default"
      });
      setImportFile(null);
      setShowImportConfirm(false);
      setOverwriteExisting(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleExport = (format: "json" | "sql") => {
    setExportFormat(format);
    exportMutation.mutate(format);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = [".json", ".sql"];
      const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isValid) {
        toast({ 
          title: "Invalid file", 
          description: "Please select a .json or .sql file",
          variant: "destructive" 
        });
        return;
      }
      
      setImportFile(file);
      setShowImportConfirm(true);
    }
  };

  const handleImport = () => {
    if (importFile) {
      importMutation.mutate({ file: importFile, overwrite: overwriteExisting });
    }
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Management</h2>
        <p className="text-muted-foreground">System information and database management</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <Server className="h-4 w-4 text-white" />
                  </div>
                  System Information
                </CardTitle>
                <CardDescription>Current system status and version</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Version</span>
                  <span className="text-sm font-semibold">{systemInfo?.version}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Node.js</span>
                  <span className="text-sm font-semibold">{systemInfo?.nodeVersion}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Platform</span>
                  <span className="text-sm font-semibold">{systemInfo?.platform}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-muted-foreground">Uptime</span>
                  <span className="text-sm font-semibold">
                    {systemInfo?.uptime ? formatUptime(systemInfo.uptime) : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  Memory Usage
                </CardTitle>
                <CardDescription>Current memory consumption</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">RSS</span>
                  <span className="text-sm font-semibold">
                    {systemInfo?.memoryUsage ? formatBytes(systemInfo.memoryUsage.rss) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Heap Total</span>
                  <span className="text-sm font-semibold">
                    {systemInfo?.memoryUsage ? formatBytes(systemInfo.memoryUsage.heapTotal) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Heap Used</span>
                  <span className="text-sm font-semibold">
                    {systemInfo?.memoryUsage ? formatBytes(systemInfo.memoryUsage.heapUsed) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-muted-foreground">External</span>
                  <span className="text-sm font-semibold">
                    {systemInfo?.memoryUsage ? formatBytes(systemInfo.memoryUsage.external) : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Database className="h-4 w-4 text-white" />
                  </div>
                  Database Statistics
                </CardTitle>
                <CardDescription>Current database records</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Challenges</span>
                  <span className="text-sm font-semibold">{systemInfo?.database.challenges || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Players</span>
                  <span className="text-sm font-semibold">{systemInfo?.database.players || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Submissions</span>
                  <span className="text-sm font-semibold">{systemInfo?.database.submissions || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-muted-foreground">Announcements</span>
                  <span className="text-sm font-semibold">{systemInfo?.database.announcements || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <HardDrive className="h-4 w-4 text-white" />
                  </div>
                  Database Management
                </CardTitle>
                <CardDescription>Export and import database</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Export Database</h4>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleExport("json")}
                      disabled={exportMutation.isPending}
                      className="flex-1"
                      variant="outline"
                    >
                      <FileJson className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                    <Button
                      onClick={() => handleExport("sql")}
                      disabled={exportMutation.isPending}
                      className="flex-1"
                      variant="outline"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export SQL
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Import Database</h4>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".json,.sql"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="import-file"
                    />
                    <label htmlFor="import-file" className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={importMutation.isPending}
                        onClick={() => document.getElementById("import-file")?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Backup
                      </Button>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports .json and .sql formats
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 shadow-lg border-blue-200 dark:border-blue-900">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Security Features Enabled
              </CardTitle>
              <CardDescription>Current security measures protecting your platform</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Rate Limiting</p>
                    <p className="text-xs text-muted-foreground">3 attempts per 15 minutes on admin login</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">CSRF Protection</p>
                    <p className="text-xs text-muted-foreground">Token-based request validation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Password Hashing</p>
                    <p className="text-xs text-muted-foreground">Bcrypt with 10 rounds</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Helmet Security</p>
                    <p className="text-xs text-muted-foreground">HTTP headers protection</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Session Security</p>
                    <p className="text-xs text-muted-foreground">Secure, HTTP-only cookies</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Input Validation</p>
                    <p className="text-xs text-muted-foreground">Zod schema validation</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Confirm Import
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to import data from <strong>{importFile?.name}</strong>?
              </p>
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                <Switch
                  id="overwrite-mode"
                  checked={overwriteExisting}
                  onCheckedChange={setOverwriteExisting}
                />
                <Label htmlFor="overwrite-mode" className="cursor-pointer">
                  <div className="text-sm font-semibold">Overwrite existing records</div>
                  <div className="text-xs text-muted-foreground">
                    {overwriteExisting 
                      ? "Existing records will be updated with imported data"
                      : "Existing records will be skipped, only new records added"}
                  </div>
                </Label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setImportFile(null);
              setOverwriteExisting(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleImport}>
              {importMutation.isPending ? "Importing..." : "Import"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
