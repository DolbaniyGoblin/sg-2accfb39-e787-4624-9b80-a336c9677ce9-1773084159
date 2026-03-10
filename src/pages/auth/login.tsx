import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔐 LoginPage: Form submitted");
    
    if (!email || !password) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }

    setLoading(true);

    try {
      console.log("LoginPage: Calling signIn...");
      const result = await authService.signIn(email, password);
      console.log("LoginPage: signIn result:", result);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.user) {
        console.log("LoginPage: Sign in successful, redirecting...");
        toast.success("Успешный вход", {
          description: "Перенаправляем в систему...",
        });
        
        // Small delay to ensure session is saved
        setTimeout(() => {
          console.log("🔐 LoginPage: Redirecting to home page...");
          window.location.href = "/";
        }, 500);
      }
    } catch (error) {
      console.error("🔐 LoginPage: Unexpected error:", error);
      toast.error("Произошла ошибка при входе");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Head>
        <title>Вход | Е.Д.С. Личный кабинет</title>
      </Head>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Е.Д.С. Личный кабинет
          </CardTitle>
          <CardDescription className="text-center">
            Войдите в свой аккаунт курьера
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="courier@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Пароль</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Забыли пароль?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Вход...
                </>
              ) : (
                "Войти"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Нет аккаунта?{" "}
            <Link
              href="/auth/register"
              className="text-primary hover:underline font-medium"
            >
              Зарегистрироваться
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}