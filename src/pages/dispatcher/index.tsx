import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, MapPin, Package, Users, Clock } from "lucide-react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type User = Database["public"]["Tables"]["users"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];
type DeliveryPoint = Database["public"]["Tables"]["delivery_points"]["Row"];

export default function DispatcherDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [couriers, setCouriers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [points, setPoints] = useState<DeliveryPoint[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    checkDispatcherAccess();
    loadData();
  }, []);

  const checkDispatcherAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "dispatcher" && profile.role !== "admin")) {
      toast.error("Доступ запрещён. Только для диспетчеров.");
      router.push("/");
      return;
    }

    setCurrentUser(profile);
  };

  const loadData = async () => {
    try {
      const [couriersRes, tasksRes, pointsRes] = await Promise.all([
        supabase.from("users").select("*").eq("role", "courier"),
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("delivery_points").select("*").order("created_at", { ascending: false })
      ]);

      if (couriersRes.data) setCouriers(couriersRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (pointsRes.data) setPoints(pointsRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalCouriers: couriers.length,
    activeCouriers: couriers.filter(c => c.status === "active").length,
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === "pending").length,
    inProgressTasks: tasks.filter(t => t.status === "in_progress").length,
    completedTasks: tasks.filter(t => t.status === "completed").length,
    totalPoints: points.length,
    activePoints: points.filter(p => p.is_active).length
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              📋 Панель диспетчера
            </h1>
            <p className="text-muted-foreground">Управление заданиями и точками доставки</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/dispatcher/add-task")} className="gap-2">
              <Plus className="h-4 w-4" />
              Создать задание
            </Button>
            <Button onClick={() => router.push("/dispatcher/add-point")} variant="outline" className="gap-2">
              <MapPin className="h-4 w-4" />
              Добавить точку
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Курьеры</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCouriers}/{stats.totalCouriers}</div>
              <p className="text-xs text-muted-foreground">Активных из общего числа</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ожидают назначения</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTasks}</div>
              <p className="text-xs text-muted-foreground">Нужно назначить курьера</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">В процессе</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgressTasks}</div>
              <p className="text-xs text-muted-foreground">Курьеры везут</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Точки доставки</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePoints}/{stats.totalPoints}</div>
              <p className="text-xs text-muted-foreground">Активных точек</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Последние задания</CardTitle>
              <CardDescription>Недавно созданные задачи</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{task.address}</p>
                      <p className="text-sm text-muted-foreground">📦 {task.box_count} коробок</p>
                    </div>
                    <Badge variant={
                      task.status === "completed" ? "default" :
                      task.status === "in_progress" ? "secondary" : "outline"
                    }>
                      {task.status === "completed" ? "✅ Готово" :
                       task.status === "in_progress" ? "🚚 В пути" : "⏳ Ожидает"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Активные курьеры</CardTitle>
              <CardDescription>Работают сейчас</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {couriers.filter(c => c.status === "active").slice(0, 5).map((courier) => (
                  <div key={courier.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{courier.full_name || "Без имени"}</p>
                      <p className="text-sm text-muted-foreground">{courier.email}</p>
                    </div>
                    <Badge>Онлайн</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}