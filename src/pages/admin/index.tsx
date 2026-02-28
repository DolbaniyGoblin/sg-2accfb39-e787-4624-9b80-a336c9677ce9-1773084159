import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Users, Package, MapPin, TrendingUp, UserCog, Shield } from "lucide-react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type User = Database["public"]["Tables"]["users"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    checkAdminAccess();
    loadData();
  }, []);

  const checkAdminAccess = async () => {
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

    if (!profile || profile.role !== "admin") {
      toast.error("Доступ запрещён. Только для администраторов.");
      router.push("/");
      return;
    }

    setCurrentUser(profile);
  };

  const loadData = async () => {
    try {
      const [usersRes, tasksRes] = await Promise.all([
        supabase.from("users").select("*").order("created_at", { ascending: false }),
        supabase.from("tasks").select("*")
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: "courier" | "dispatcher" | "admin") => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Роль успешно изменена");
      loadData();
    } catch (error) {
      console.error("Error changing role:", error);
      toast.error("Ошибка изменения роли");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    
    try {
      const { error } = await supabase
        .from("users")
        .update({ status: newStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success(newStatus === "blocked" ? "Пользователь заблокирован" : "Пользователь разблокирован");
      loadData();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Ошибка изменения статуса");
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: "destructive",
      dispatcher: "default",
      courier: "secondary"
    } as const;

    const labels = {
      admin: "👑 Админ",
      dispatcher: "📋 Диспетчер",
      courier: "🚚 Курьер"
    };

    return <Badge variant={variants[role as keyof typeof variants] || "secondary"}>{labels[role as keyof typeof labels] || role}</Badge>;
  };

  const stats = {
    totalUsers: users.length,
    couriers: users.filter(u => u.role === "courier").length,
    dispatchers: users.filter(u => u.role === "dispatcher").length,
    admins: users.filter(u => u.role === "admin").length,
    activeTasks: tasks.filter(t => t.status === "in_progress").length,
    completedTasks: tasks.filter(t => t.status === "completed").length
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
              <Shield className="h-8 w-8 text-red-500" />
              Панель администратора
            </h1>
            <p className="text-muted-foreground">Управление системой КурьерПро</p>
          </div>
          <Button onClick={() => router.push("/")} variant="outline">
            На главную
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Активных и заблокированных</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Курьеры</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.couriers}</div>
              <p className="text-xs text-muted-foreground">Работают на линии</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Диспетчеры</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dispatchers}</div>
              <p className="text-xs text-muted-foreground">Управляют заданиями</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Активные задания</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTasks}</div>
              <p className="text-xs text-muted-foreground">Выполняются сейчас</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Завершено</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">Доставлено за всё время</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Администраторы</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admins}</div>
              <p className="text-xs text-muted-foreground">С полным доступом</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Управление пользователями</CardTitle>
            <CardDescription>Изменение ролей и статусов пользователей</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{user.full_name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.full_name || "Без имени"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleBadge(user.role)}
                        <Badge variant={user.status === "active" ? "default" : "destructive"}>
                          {user.status === "active" ? "Активен" : "Заблокирован"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => changeUserRole(user.id, e.target.value as any)}
                      className="px-3 py-2 border rounded-md text-sm"
                      disabled={user.id === currentUser?.id}
                    >
                      <option value="courier">Курьер</option>
                      <option value="dispatcher">Диспетчер</option>
                      <option value="admin">Админ</option>
                    </select>
                    
                    <Button
                      variant={user.status === "active" ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleUserStatus(user.id, user.status)}
                      disabled={user.id === currentUser?.id}
                    >
                      {user.status === "active" ? "Заблокировать" : "Разблокировать"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}