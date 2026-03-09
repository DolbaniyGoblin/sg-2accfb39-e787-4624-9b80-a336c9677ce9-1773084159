import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Shield } from "lucide-react";

export default function SetupAdmin() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword, secretCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `✅ Пароль успешно установлен для ${email}! Теперь можете войти на /auth/login`,
        });
        setEmail("");
        setNewPassword("");
        setSecretCode("");
      } else {
        setMessage({
          type: "error",
          text: data.error || "Ошибка при установке пароля",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Ошибка сети. Проверьте подключение.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md border-purple-500/20 bg-slate-900/80 backdrop-blur">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-purple-500" />
            <CardTitle className="text-2xl font-bold text-white">Первичная настройка</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Установите пароль для входа в систему
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ivan.kurierov@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Новый пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Минимум 6 символов"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret" className="text-slate-200">Секретный код</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Из .env.local"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"} className="border-purple-500/20">
                {message.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? "Установка пароля..." : "Установить пароль"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-2">📋 Инструкция:</h3>
            <ol className="text-xs text-slate-400 space-y-1">
              <li>1. Введите email: <code className="text-purple-400">ivan.kurierov@gmail.com</code></li>
              <li>2. Придумайте пароль (минимум 6 символов)</li>
              <li>3. Секретный код из <code className="text-purple-400">.env.local</code>: <code className="text-purple-400">your-super-secret-key-12345</code></li>
              <li>4. После успеха → войдите на <code className="text-purple-400">/auth/login</code></li>
            </ol>
          </div>

          <div className="mt-4 text-center">
            <a href="/auth/login" className="text-sm text-purple-400 hover:text-purple-300">
              Уже есть пароль? Войти →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}