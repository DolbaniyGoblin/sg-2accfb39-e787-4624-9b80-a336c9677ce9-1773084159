import { useState } from "react";
import { useRouter } from "next/router";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SEO } from "@/components/SEO";
import { Shield, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function RegisterAdmin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    secretCode: "",
    role: "admin" as "admin" | "dispatcher",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Проверка секретного кода
      const adminCode = process.env.NEXT_PUBLIC_ADMIN_SECRET_CODE || "ADMIN_2024";
      const dispatcherCode = process.env.NEXT_PUBLIC_DISPATCHER_SECRET_CODE || "DISPATCH_2024";

      let targetRole: "admin" | "dispatcher" = "admin";

      if (formData.secretCode === adminCode) {
        targetRole = "admin";
      } else if (formData.secretCode === dispatcherCode) {
        targetRole = "dispatcher";
      } else {
        throw new Error("Неверный секретный код. Проверьте правильность ввода.");
      }

      // Регистрация
      const { user, error: authError } = await authService.signUp(
        formData.email,
        formData.password
      );

      if (authError || !user) throw new Error(authError?.message || "Ошибка регистрации");

      // Вставка данных пользователя в таблицу users (не UPDATE, а INSERT!)
      const { supabase } = await import("@/integrations/supabase/client");
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone,
          role: targetRole,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error(`Ошибка создания профиля: ${insertError.message}`);
      }

      // Перенаправление на нужную панель
      if (targetRole === "admin") {
        router.push("/admin");
      } else {
        router.push("/dispatcher");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Регистрация Администратора | КурьерПро"
        description="Регистрация с секретным кодом для администраторов и диспетчеров"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <Card className="w-full max-w-md bg-gray-800/50 backdrop-blur border-gray-700">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Регистрация Администратора
            </CardTitle>
            <CardDescription className="text-gray-400">
              Для регистрации требуется секретный код доступа
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="secretCode" className="text-gray-200">
                  🔑 Секретный код доступа *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="secretCode"
                    type="password"
                    placeholder="Введите секретный код"
                    value={formData.secretCode}
                    onChange={(e) =>
                      setFormData({ ...formData, secretCode: e.target.value })
                    }
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Код для администратора или диспетчера
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-200">
                  Полное имя *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Иван Иванов"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-200">
                  Телефон
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">
                  Пароль *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white"
                disabled={loading}
              >
                {loading ? "Регистрация..." : "🛡️ Зарегистрироваться"}
              </Button>

              <div className="text-center text-sm text-gray-400">
                <p>Уже есть аккаунт?</p>
                <Link
                  href="/auth/login"
                  className="text-yellow-400 hover:text-yellow-300 font-medium"
                >
                  Войти в систему
                </Link>
              </div>
            </form>

            <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
              <p className="text-xs text-gray-400 mb-2">
                <strong className="text-gray-300">📝 Примечание:</strong>
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Секретные коды доступа выдаются администратором системы</li>
                <li>• Для администратора и диспетчера разные коды</li>
                <li>• После регистрации вы получите соответствующую роль</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}