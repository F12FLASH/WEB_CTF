import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Shield, Database, CheckCircle, AlertCircle } from "lucide-react";

export default function Install() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"check" | "setup" | "complete">("check");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<"checking" | "ok" | "error">("checking");

  const checkDatabase = async () => {
    try {
      const res = await fetch("/api/install/check");
      const data = await res.json();
      
      if (data.needsSetup) {
        setDbStatus("ok");
        setStep("setup");
      } else {
        setDbStatus("ok");
        setStep("complete");
      }
    } catch (err) {
      setDbStatus("error");
      setError("Không thể kết nối database. Vui lòng kiểm tra cấu hình DATABASE_URL.");
    }
  };

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/install/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Cài đặt thất bại");
      }

      setStep("complete");
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi cài đặt");
    } finally {
      setLoading(false);
    }
  };

  if (step === "check") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Database className="w-12 h-12 mx-auto mb-4 text-blue-500" />
            <CardTitle className="text-2xl">Cài đặt CTF Platform</CardTitle>
            <CardDescription>
              Hệ thống cần được cấu hình lần đầu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              {dbStatus === "checking" && (
                <div className="animate-pulse text-gray-500">
                  Đang kiểm tra database...
                </div>
              )}
              {dbStatus === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            <Button
              onClick={checkDatabase}
              disabled={dbStatus === "checking"}
              className="w-full"
            >
              {dbStatus === "checking" ? "Đang kiểm tra..." : "Bắt đầu cài đặt"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "setup") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <CardTitle className="text-2xl">Tạo tài khoản Admin</CardTitle>
            <CardDescription>
              Tạo tài khoản admin đầu tiên để quản lý hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInstall} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  placeholder="admin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500">
                  Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Đang cài đặt..." : "Cài đặt hệ thống"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <CardTitle className="text-2xl">Cài đặt thành công!</CardTitle>
          <CardDescription>
            Hệ thống CTF Platform đã sẵn sàng sử dụng
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-2">
            <p className="text-sm text-green-400">✓ Database đã được khởi tạo</p>
            <p className="text-sm text-green-400">✓ Tài khoản admin đã được tạo</p>
            <p className="text-sm text-green-400">✓ Dữ liệu mẫu đã được thêm</p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => setLocation("/admin/login")}
              className="w-full"
            >
              Đăng nhập Admin
            </Button>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="w-full"
            >
              Về trang chủ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
