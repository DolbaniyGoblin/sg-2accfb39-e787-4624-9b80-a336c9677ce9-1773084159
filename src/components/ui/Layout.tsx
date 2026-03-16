import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import {
  Home,
  MapPin,
  Package,
  History,
  User,
  Bell,
  Menu,
  LogOut,
  List,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  const router = useRouter();

  // ВРЕМЕННЫЙ МОК-ПОЛЬЗОВАТЕЛЬ ДЛЯ ТЕСТИРОВАНИЯ
  const mockUser = {
    id: "test-courier-id",
    email: "courier@test.com",
    user_metadata: {
      role: "courier",
      full_name: "Тестовый Курьер"
    }
  };

  const handleLogout = () => {
    console.log("🔓 Logout disabled - mock user active");
    // Авторизация отключена
  };

  const navigation = [
    { name: "Главная", href: "/courier-dashboard", icon: Home },
    { name: "Маршрутный лист", href: "/route-list", icon: List },
    { name: "Карта", href: "/map", icon: MapPin },
    { name: "Мои коробки", href: "/my-boxes", icon: Package },
    { name: "История", href: "/history", icon: History },
    { name: "Уведомления", href: "/notifications", icon: Bell },
    { name: "Профиль", href: "/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle>Меню</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-4">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
                          router.pathname === item.href
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                  <Button
                    variant="ghost"
                    className="justify-start gap-3 text-muted-foreground"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Выход
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/courier-dashboard" className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg hidden sm:inline-block">
                {title || "Курьерская служба"}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline-block">
              {mockUser.user_metadata?.full_name || mockUser.email}
            </span>
            <ThemeSwitch />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hidden md:inline-flex"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">{children}</main>
    </div>
  );
}