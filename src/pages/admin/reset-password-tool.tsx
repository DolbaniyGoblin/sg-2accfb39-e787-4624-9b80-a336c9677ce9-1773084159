import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Key } from "lucide-react";

export default function ResetPasswordTool() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword, adminSecret })
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message });
        setEmail("");
        setNewPassword("");
      } else {
        setResult({ success: false, message: data.error || "Failed to reset password" });
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-6 w-6 text-primary" />
            <CardTitle>Admin Password Reset Tool</CardTitle>
          </div>
          <CardDescription>
            Reset password for any user using Supabase Admin API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="text"
                placeholder="NewPassword123!"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Admin Secret Key</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Enter admin secret"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Check .env.local for ADMIN_RESET_SECRET
              </p>
            </div>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Quick Test:</h4>
            <p className="text-xs text-muted-foreground mb-1">
              Email: ivan.kurierov@gmail.com
            </p>
            <p className="text-xs text-muted-foreground mb-1">
              Password: NewPass123!
            </p>
            <p className="text-xs text-muted-foreground">
              Secret: your-super-secret-key-12345
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}