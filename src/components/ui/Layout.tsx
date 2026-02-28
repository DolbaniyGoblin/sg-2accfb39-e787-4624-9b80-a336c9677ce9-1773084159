import { ReactNode } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import { Loader2, User, History, Home, Package, Map } from "lucide-react";
import Link from "next/link";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  requireAuth?: boolean;
}

export function Layout({ children, title = "Е.Д.С. Личный кабинет", requireAuth = true }: LayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAuth && !user) {
    router.push("/auth/login");
    return null;
  }

  const navItems = [
    { icon: Home, label: "Дашборд", href: "/" },
    { icon: Package, label: "Коробки", href: "/boxes" },
    { icon: Map, label: "Карта", href: "/map" },
    { icon: History, label: "История", href: "/history" },
    { icon: User, label: "Профиль", href: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <main className="flex-1 pb-20">{children}</main>

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
          <div className="flex justify-around items-center h-16 px-2">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <Toaster position="top-center" />
    </div>
  );
}