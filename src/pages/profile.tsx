import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { LogOut, Star, Calendar, Phone, Mail, Package, TrendingUp, Award, Shield, ClipboardList, Camera, Edit } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CourierStats {
  totalDeliveries: number;
  monthDeliveries: number;
  weekDeliveries: number;
  todayDeliveries: number;
  monthEarnings: number;
  avgRating: number;
  totalDistance: number;
  onTimePercent: number;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<CourierStats>({
    totalDeliveries: 0,
    monthDeliveries: 0,
    weekDeliveries: 0,
    todayDeliveries: 0,
    monthEarnings: 0,
    avgRating: 5.0,
    totalDistance: 0,
    onTimePercent: 100,
  });
  const [dbUser, setDbUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch user from database - cast to any to bypass deep type inference
      const { data: userData } = await (supabase as any)
        .from("users")
        .select("id, email, phone, full_name, role, rating, experience_months, photo_url, created_at")
        .eq("id", user.id)
        .single();
      
      if (userData) setDbUser(userData);

      // Fetch real statistics
      await fetchUserStats();
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user?.id) return;

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));

      // Total deliveries
      const { count: totalCount } = await supabase
        .from("deliveries")
        .select("id", { count: "exact", head: true })
        .eq("courier_id", user.id)
        .eq("status", "delivered");

      // Month deliveries
      const { count: monthCount } = await supabase
        .from("deliveries")
        .select("id", { count: "exact", head: true })
        .eq("courier_id", user.id)
        .eq("status", "delivered")
        .gte("delivered_at", startOfMonth.toISOString());

      // Week deliveries
      const { count: weekCount } = await supabase
        .from("deliveries")
        .select("id", { count: "exact", head: true })
        .eq("courier_id", user.id)
        .eq("status", "delivered")
        .gte("delivered_at", startOfWeek.toISOString());

      // Today deliveries
      const { count: todayCount } = await supabase
        .from("deliveries")
        .select("id", { count: "exact", head: true })
        .eq("courier_id", user.id)
        .eq("status", "delivered")
        .gte("delivered_at", startOfDay.toISOString());

      // Calculate earnings (assuming 150 RUB per delivery)
      const monthEarnings = (monthCount || 0) * 150;

      // Calculate total distance from saved routes
      const { data: routes } = await (supabase as any)
        .from("saved_routes")
        .select("total_distance")
        .eq("courier_id", user.id);

      const totalDistance = routes?.reduce((sum: number, r: any) => sum + (r.total_distance || 0), 0) || 0;

      // Calculate on-time percentage
      const { data: tasksData } = await (supabase as any)
        .from("tasks")
        .select("scheduled_time, updated_at")
        .eq("courier_id", user.id)
        .eq("status", "delivered");

      let onTimeCount = 0;
      tasksData?.forEach((t: any) => {
        if (t.updated_at && t.scheduled_time) {
          const deliveredTime = new Date(t.updated_at);
          const scheduledTime = new Date(t.scheduled_time);
          if (deliveredTime <= scheduledTime) onTimeCount++;
        }
      });

      const onTimePercent = tasksData && tasksData.length > 0
        ? Math.round((onTimeCount / tasksData.length) * 100)
        : 100;

      setStats({
        totalDeliveries: totalCount || 0,
        monthDeliveries: monthCount || 0,
        weekDeliveries: weekCount || 0,
        todayDeliveries: todayCount || 0,
        monthEarnings,
        avgRating: user?.rating || 5.0,
        totalDistance: Math.round(totalDistance * 10) / 10,
        onTimePercent,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("✅ Вы вышли из аккаунта");
      router.push("/auth/login");
    } catch (error) {
      toast.error("❌ Ошибка при выходе");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return { variant: "destructive" as const, icon: "👑", label: "Администратор" };
      case "dispatcher":
        return { variant: "default" as const, icon: "📋", label: "Диспетчер" };
      default:
        return { variant: "secondary" as const, icon: "🚚", label: "Курьер" };
    }
  };

  if (isLoading) {
    return (
      <Layout title="Профиль">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  const roleBadge = dbUser?.role ? getRoleBadge(dbUser.role) : getRoleBadge("courier");

  return (
    <Layout title="Профиль | КурьерПро PRO">
      <div className="p-4 space-y-6 pb-24">
        {/* Profile Header */}
        <Card className="border-primary/20 shadow-xl bg-gradient-to-br from-background to-muted/30">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="w-28 h-28 border-4 border-primary/30 shadow-lg">
                  <AvatarImage src={user?.photo_url || ""} alt={user?.full_name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                    {user?.full_name ? getInitials(user.full_name) : "КП"}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-2xl font-bold mb-1">{user?.full_name || "Курьер"}</h2>
              <p className="text-sm text-muted-foreground mb-4">ID: {user?.id.slice(0, 8)}...</p>

              <Badge className="mb-4" variant={roleBadge.variant}>
                {roleBadge.icon} {roleBadge.label}
              </Badge>

              {/* Quick Actions for Admin/Dispatcher */}
              {(dbUser?.role === "admin" || dbUser?.role === "dispatcher") && (
                <div className="flex flex-col gap-2 w-full mb-4">
                  {dbUser?.role === "dispatcher" && (
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 border-primary/50 hover:bg-primary/10"
                      onClick={() => router.push("/dispatcher")}
                    >
                      <ClipboardList className="w-4 h-4" />
                      📋 Панель Диспетчера
                    </Button>
                  )}
                  
                  {dbUser?.role === "admin" && (
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 border-red-500/50 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => router.push("/admin")}
                    >
                      <Shield className="w-4 h-4 text-red-500" />
                      👑 Панель Администратора
                    </Button>
                  )}
                </div>
              )}

              {/* Rating & Experience */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-full shadow-sm">
                  <Star className="w-5 h-5 text-yellow-600 mr-2 fill-yellow-600" />
                  <span className="font-bold text-lg text-yellow-700 dark:text-yellow-500">
                    {stats.avgRating.toFixed(1)}
                  </span>
                </div>
                <Badge variant="outline" className="flex items-center gap-2 px-4 py-2">
                  <Calendar className="w-4 h-4" />
                  {user?.experience_months || 0} мес. стажа
                </Badge>
              </div>

              {/* Contact Info */}
              <div className="flex flex-col gap-2 w-full text-left bg-muted/50 rounded-lg p-4">
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">{user?.phone}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today Stats */}
        <Card className="border-green-500/30 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-green-600" />
              📦 Сегодня
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 rounded-lg p-4 text-center shadow-sm">
                <Package className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-700 dark:text-green-500">{stats.todayDeliveries}</p>
                <p className="text-xs text-muted-foreground mt-1">Доставлено</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 rounded-lg p-4 text-center shadow-sm">
                <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-500">{stats.todayDeliveries * 150}₽</p>
                <p className="text-xs text-muted-foreground mt-1">Заработано</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Stats */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="w-5 h-5 text-primary" />
              📊 Статистика за месяц
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Package className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.monthDeliveries}</p>
                <p className="text-xs text-muted-foreground">Доставок</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{stats.monthEarnings.toLocaleString()}₽</p>
                <p className="text-xs text-muted-foreground">Заработано</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{stats.weekDeliveries}</p>
                <p className="text-xs text-muted-foreground">За неделю</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Award className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{stats.onTimePercent}%</p>
                <p className="text-xs text-muted-foreground">Вовремя</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Time Stats */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">🏆 За всё время</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground font-medium">Всего доставок</span>
                <span className="font-bold text-xl">{stats.totalDeliveries}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground font-medium">Пройдено км</span>
                <span className="font-bold text-xl">{stats.totalDistance.toFixed(1)} км</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground font-medium">Средний рейтинг</span>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                  <span className="font-bold text-xl">{stats.avgRating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out Button */}
        <Button
          variant="destructive"
          className="w-full shadow-lg"
          size="lg"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Выйти из аккаунта
        </Button>
      </div>
    </Layout>
  );
}