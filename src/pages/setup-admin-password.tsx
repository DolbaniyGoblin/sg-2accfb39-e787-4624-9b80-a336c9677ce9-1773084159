import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SetupAdminPassword() {
  const [email, setEmail] = useState("admin@courierpro.ru");
  const [password, setPassword] = useState("AdminTest2024!");
  const [secretCode, setSecretCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          newPassword: password,
          secretCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: "✅ Пароль успешно установлен! Теперь можете войти на /auth/login",
        });
      } else {
        setResult({
          success: false,
          message: `❌ Ошибка: ${data.error}`,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `❌ Ошибка: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🔧 Установка пароля администратора</CardTitle>
          <CardDescription>
            Одноразовая настройка пароля для admin@courierpro.ru
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email администратора</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@courierpro.ru"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Новый пароль</label>
            <Input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="AdminTest2024!"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Секретный код</label>
            <Input
              type="password"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              placeholder="Введите ADMIN_RESET_SECRET"
            />
            <p className="text-xs text-muted-foreground">
              Код из .env.local (ADMIN_RESET_SECRET)
            </p>
          </div>

          <Button
            onClick={handleSetup}
            disabled={loading || !email || !password || !secretCode}
            className="w-full"
          >
            {loading ? "⏳ Установка..." : "🔑 Установить пароль"}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm space-y-1">
            <p className="font-semibold">📝 Инструкция:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Откройте .env.local</li>
              <li>Найдите ADMIN_RESET_SECRET</li>
              <li>Скопируйте значение в поле "Секретный код"</li>
              <li>Нажмите "Установить пароль"</li>
              <li>После успеха идите на /auth/login</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}