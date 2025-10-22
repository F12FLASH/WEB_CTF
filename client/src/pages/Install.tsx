import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Shield, Database, CheckCircle, AlertCircle, Server, Settings, Loader2 } from "lucide-react";

interface SystemCheck {
  hasDatabase: boolean;
  databaseConnected: boolean;
  isInstalled: boolean;
  schemaReady: boolean;
  adminCount: number;
  challengeCount: number;
  playerCount: number;
}

export default function Install() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"check" | "config" | "installing" | "complete">("check");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [siteName, setSiteName] = useState("CTF Platform");
  const [siteDescription, setSiteDescription] = useState("Capture The Flag Competition");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [systemCheck, setSystemCheck] = useState<SystemCheck | null>(null);
  const [installProgress, setInstallProgress] = useState(0);

  useEffect(() => {
    if (step === "check") {
      performSystemCheck();
    }
  }, [step]);

  useEffect(() => {
    if (systemCheck?.isInstalled && step === "check") {
      setStep("complete");
    }
  }, [systemCheck, step]);

  useEffect(() => {
    if (step === "complete") {
      fetch("/api/site-info")
        .then(res => res.json())
        .then(data => {
          if (data.siteName) setSiteName(data.siteName);
          if (data.siteDescription) setSiteDescription(data.siteDescription);
        })
        .catch(err => console.error("Failed to fetch site info:", err));
    }
  }, [step]);

  const performSystemCheck = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Try admin endpoint first (will work if logged in as admin)
      let res = await fetch("/api/install/admin-system-check", {
        credentials: "include"
      });
      
      // If not authorized (401 or 403), try regular public endpoint
      if (res.status === 401 || res.status === 403) {
        res = await fetch("/api/install/system-check", {
          credentials: "include"
        });
      }
      
      if (!res.ok) {
        throw new Error("Không thể tải thông tin hệ thống");
      }
      
      const data = await res.json();
      setSystemCheck(data);

      if (data.isInstalled) {
        setStep("complete");
      } else if (data.databaseConnected) {
        setStep("config");
      }
    } catch (err: any) {
      setError("Không thể kết nối đến hệ thống. Vui lòng kiểm tra cấu hình.");
      setSystemCheck({
        hasDatabase: false,
        databaseConnected: false,
        isInstalled: false,
        schemaReady: false,
        adminCount: 0,
        challengeCount: 0,
        playerCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (adminPassword !== confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    if (adminPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    if (!/[A-Z]/.test(adminPassword)) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ HOA");
      return;
    }

    if (!/[a-z]/.test(adminPassword)) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ thường");
      return;
    }

    if (!/[0-9]/.test(adminPassword)) {
      setError("Mật khẩu phải chứa ít nhất 1 số");
      return;
    }

    setStep("installing");
    setLoading(true);
    setInstallProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setInstallProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const res = await fetch("/api/install/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUsername,
          adminPassword,
          siteName,
          siteDescription,
        }),
      });

      const data = await res.json();

      clearInterval(progressInterval);
      setInstallProgress(100);

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Cài đặt thất bại");
      }

      setTimeout(() => {
        setStep("complete");
      }, 500);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi cài đặt");
      setStep("config");
    } finally {
      setLoading(false);
    }
  };

  if (step === "check") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <Card className="w-full max-w-2xl bg-gray-800/50 border-gray-700 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Server className="h-16 w-16 text-blue-500" />
            </div>
            <CardTitle className="text-3xl text-white">Kiểm Tra Hệ Thống</CardTitle>
            <CardDescription className="text-gray-300">
              Đang kiểm tra cài đặt và kết nối hệ thống...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : systemCheck ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                  {systemCheck.hasDatabase ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-gray-200">Cơ sở dữ liệu: {systemCheck.hasDatabase ? "Có sẵn" : "Không có"}</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                  {systemCheck.databaseConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-gray-200">Kết nối Database: {systemCheck.databaseConnected ? "Thành công" : "Thất bại"}</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                  {systemCheck.schemaReady ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-gray-200">Schema Database: {systemCheck.schemaReady ? "Sẵn sàng" : "Chưa sẵn sàng"}</span>
                </div>

                {systemCheck.databaseConnected && !systemCheck.isInstalled && (
                  <div className="mt-6">
                    <Button 
                      onClick={() => setStep("config")}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Tiếp tục cài đặt
                    </Button>
                  </div>
                )}

                {!systemCheck.databaseConnected && (
                  <div className="mt-4">
                    <Button 
                      onClick={performSystemCheck}
                      variant="outline"
                      className="w-full"
                    >
                      Kiểm tra lại
                    </Button>
                  </div>
                )}
              </div>
            ) : null}

            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "config") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <Card className="w-full max-w-2xl bg-gray-800/50 border-gray-700 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Settings className="h-16 w-16 text-blue-500" />
            </div>
            <CardTitle className="text-3xl text-white">Cấu Hình Hệ Thống</CardTitle>
            <CardDescription className="text-gray-300">
              Thiết lập thông tin website và tài khoản quản trị
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInstall} className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-700/50 rounded-lg space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    Thông Tin Website
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="siteName" className="text-gray-200">Tên Website</Label>
                    <Input
                      id="siteName"
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="CTF Platform"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteDescription" className="text-gray-200">Mô Tả Website</Label>
                    <Input
                      id="siteDescription"
                      type="text"
                      value={siteDescription}
                      onChange={(e) => setSiteDescription(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Capture The Flag Competition"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-700/50 rounded-lg space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    Tài Khoản Quản Trị
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="adminUsername" className="text-gray-200">Tên đăng nhập Admin</Label>
                    <Input
                      id="adminUsername"
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="admin"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword" className="text-gray-200">Mật khẩu Admin</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-200">Xác nhận mật khẩu</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Nhập lại mật khẩu"
                      required
                    />
                  </div>

                  <div className="text-sm text-gray-400 space-y-1">
                    <p>Yêu cầu mật khẩu:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li className={adminPassword.length >= 8 ? "text-green-400" : ""}>
                        Tối thiểu 8 ký tự
                      </li>
                      <li className={/[A-Z]/.test(adminPassword) ? "text-green-400" : ""}>
                        Ít nhất 1 chữ HOA
                      </li>
                      <li className={/[a-z]/.test(adminPassword) ? "text-green-400" : ""}>
                        Ít nhất 1 chữ thường
                      </li>
                      <li className={/[0-9]/.test(adminPassword) ? "text-green-400" : ""}>
                        Ít nhất 1 số
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("check")}
                  disabled={loading}
                  className="flex-1"
                >
                  Quay lại
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Đang cài đặt..." : "Bắt đầu cài đặt"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "installing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <Card className="w-full max-w-2xl bg-gray-800/50 border-gray-700 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            </div>
            <CardTitle className="text-3xl text-white">Đang Cài Đặt...</CardTitle>
            <CardDescription className="text-gray-300">
              Hệ thống đang được cấu hình và khởi tạo dữ liệu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Tiến độ cài đặt</span>
                <span>{installProgress}%</span>
              </div>
              <Progress value={installProgress} className="h-3" />
            </div>

            <div className="space-y-2 text-sm text-gray-400">
              <div className={installProgress >= 20 ? "text-green-400" : ""}>
                ✓ Tạo tài khoản quản trị
              </div>
              <div className={installProgress >= 40 ? "text-green-400" : ""}>
                ✓ Cấu hình thông tin website
              </div>
              <div className={installProgress >= 60 ? "text-green-400" : ""}>
                ✓ Khởi tạo dữ liệu demo
              </div>
              <div className={installProgress >= 80 ? "text-green-400" : ""}>
                ✓ Hoàn tất cài đặt
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <Card className="w-full max-w-2xl bg-gray-800/50 border-gray-700 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl text-white">
            {siteName || "CTF Platform"}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {siteDescription || "Hệ thống CTF Platform đã sẵn sàng sử dụng"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg space-y-2">
            <p className="text-green-400 font-semibold">✓ Hệ thống đã được cài đặt!</p>
            <p className="text-gray-300 text-sm">
              {systemCheck?.isInstalled && systemCheck.adminCount > 0 ? (
                <>
                  Trang web đã được cài đặt và sẵn sàng sử dụng. Hệ thống bao gồm:
                  <ul className="mt-2 space-y-1 ml-4">
                    <li>• {systemCheck.challengeCount} thử thách CTF</li>
                    <li>• {systemCheck.playerCount} người chơi đã đăng ký</li>
                    <li>• Dữ liệu demo và thông báo</li>
                  </ul>
                </>
              ) : (
                "Hệ thống đã được cài đặt thành công với dữ liệu demo."
              )}
            </p>
          </div>

          {systemCheck?.adminCount && systemCheck.adminCount > 0 ? (
            <Alert className="bg-blue-900/20 border-blue-800">
              <Shield className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-gray-300 text-sm">
                Bạn có thể đăng nhập với tài khoản admin để quản lý hệ thống, hoặc đăng ký tài khoản người dùng để tham gia các thử thách CTF.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex gap-3">
            <Button
              onClick={() => setLocation("/")}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Về trang chủ
            </Button>
            <Button
              onClick={() => setLocation("/admin/login")}
              variant="outline"
              className="flex-1"
            >
              Đăng nhập Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
