import { useEffect, useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Package, TrendingUp, Clock, MapPin, Award, Calendar } from "lucide-react";
import Link from "next/link";
import { CourierLeaderboard } from "@/components/analytics/CourierLeaderboard";
import { StatsChart } from "@/components/analytics/StatsChart";
import confetti from "@/lib/confetti";

interface Stats {
  today: number;
  week: number;
  month: number;
  boxes: number;
  distance: number;
  earnings: number;
  rating: number;
}

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  date?: string;
}

export default function CourierDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    today: 0,
    week: 0,
    month: 0,
    boxes: 0,
    distance: 0,
    earnings: 0,
    rating: 0,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchAchievements();
      
      const channel = supabase
        .channel("dashboard_updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tasks",
            filter: `courier_id=eq.${user.id}`,
          },
          () => {
            fetchStats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data: todayTasks } = await supabase
        .from("tasks")
        .select("*, boxes_count")
        .eq("courier_id", user.id)
        .eq("status", "delivered")
        .gte("completed_at", today.toISOString());

      const { data: weekTasks } = await supabase
        .from("tasks")
        .select("*, boxes_count")
        .eq("courier_id", user.id)
        .eq("status", "delivered")
        .gte("completed_at", weekAgo.toISOString());

      const { data: monthTasks } = await supabase
        .from("tasks")
        .select("*, boxes_count")
        .eq("courier_id", user.id)
        .eq("status", "delivered")
        .gte("completed_at", monthAgo.toISOString());

      const { data: profile } = await supabase
        .from("profiles")
        .select("rating")
        .eq("id", user.id)
        .single();

      const todayBoxes = todayTasks?.reduce((sum, t) => sum + (t.boxes_count || 0), 0) || 0;
      const monthBoxes = monthTasks?.reduce((sum, t) => sum + (t.boxes_count || 0), 0) || 0;

      setStats({
        today: todayTasks?.length || 0,
        week: weekTasks?.length || 0,
        month: monthTasks?.length || 0,
        boxes: todayBoxes,
        distance: Math.round((monthTasks?.length || 0) * 3.5),
        earnings: (monthTasks?.length || 0) * 250,
        rating: profile?.rating || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    if (!user) return;

    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, status, completed_at")
      .eq("courier_id", user.id)
      .eq("status", "delivered");

    const { data: profile } = await supabase
      .from("profiles")
      .select("rating, created_at")
      .eq("id", user.id)
      .single();

    const totalDeliveries = tasks?.length || 0;
    const rating = profile?.rating || 0;

    const todayDeliveries = tasks?.filter(t => {
      const completedDate = new Date(t.completed_at || "");
      const today = new Date();
      return completedDate.toDateString() === today.toDateString();
    }).length || 0;

    const achievementsList: Achievement[] = [
      {
        id: "first",
        icon: "🏆",
        title: "Первая доставка",
        description: "Выполните первую доставку",
        unlocked: totalDeliveries >= 1,
        date: tasks?.[0]?.completed_at,
      },
      {
        id: "hundred",
        icon: "🚀",
        title: "100 доставок",
        description: "Выполните 100 доставок",
        unlocked: totalDeliveries >= 100,
      },
      {
        id: "speed",
        icon: "⚡",
        title: "Скоростной",
        description: "Выполните 10 доставок за день",
        unlocked: todayDeliveries >= 10,
      },
      {
        id: "excellent",
        icon: "⭐",
        title: "Отличник",
        description: "Получите рейтинг 4.9+",
        unlocked: rating >= 4.9,
      },
    ];

    setAchievements(achievementsList);

    const newUnlocked = achievementsList.filter(a => a.unlocked);
    if (newUnlocked.length > 0 && totalDeliveries === 1) {
      confetti();
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, trend }: any) => (
    <Card className="hover-lift">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-2">{value}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${trend === "up" ? "bg-green-500/10" : "bg-primary/10"}`}>
            <Icon className={`w-6 h-6 ${trend === "up" ? "text-green-500" : "text-primary"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Layout title="Загрузка...">
        <div className="p-4">Загрузка дашборда...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Дашборд | КурьерПро PRO">
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="p-4 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Добрый день! 👋</h1>
              <p className="text-muted-foreground mt-1">
                Сегодня выполнено {stats.today} доставок
              </p>
            </div>
            <Link href="/route-list">
              <Button size="lg">
                <MapPin className="w-4 h-4 mr-2" />
                Маршрутный лист
              </Button>
            </Link>
          </div>

          {/* Period Tabs */}
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList>
              <TabsTrigger value="today">Сегодня</TabsTrigger>
              <TabsTrigger value="week">Неделя</TabsTrigger>
              <TabsTrigger value="month">Месяц</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard
              icon={Package}
              title="Доставок"
              value={period === "today" ? stats.today : period === "week" ? stats.week : stats.month}
              subtitle={`${stats.boxes} коробок`}
              trend="up"
            />
            <StatCard
              icon={Clock}
              title="Средний час"
              value="1.5ч"
              subtitle="на доставку"
            />
            <StatCard
              icon={MapPin}
              title="Расстояние"
              value={`${stats.distance}км`}
              subtitle="за месяц"
            />
            <StatCard
              icon={TrendingUp}
              title="Заработано"
              value={`${stats.earnings.toLocaleString()}₽`}
              subtitle="за месяц"
            />
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Доставки по дням</CardTitle>
              </CardHeader>
              <CardContent>
                <StatsChart courierId={user?.id || ""} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Достижения
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        achievement.unlocked
                          ? "border-primary bg-primary/5"
                          : "border-dashed border-muted opacity-50"
                      }`}
                    >
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <h4 className="font-semibold text-sm">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                      {achievement.unlocked && achievement.date && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(achievement.date).toLocaleDateString("ru")}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Таблица лидеров
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CourierLeaderboard currentUserId={user?.id || ""} />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}