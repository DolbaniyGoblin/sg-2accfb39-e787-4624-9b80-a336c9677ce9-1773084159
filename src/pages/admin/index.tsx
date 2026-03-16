import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Package, TrendingUp, Shield, UserCog, MapPin, UserPlus, Mail, Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { StatsChart } from "@/components/analytics/StatsChart";
import { CourierLeaderboard } from "@/components/analytics/CourierLeaderboard";
import { dispatcherService } from "@/services/dispatcherService";

interface AdminUser {
  id: string;
  email?: string;
  full_name?: string;
  role?: "courier" | "dispatcher" | "admin";
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: "courier" | "dispatcher" | "admin";
  status: "active" | "blocked";
  photo_url?: string;
  created_at: string;
}

interface DashboardStats {
  totalUsers: number;
  activeCouriers: number;
  dispatchers: number;
  admins: number;
  activeTasks: number;
  completedTasks: number;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const currentUser = user as unknown as AdminUser;
  
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeCouriers: 0,
    dispatchers: 0,
    admins: 0,
    activeTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"day" | "week" | "month">("week");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  // New user creation state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserRole, setNewUserRole] = useState<"courier" | "dispatcher" | "admin">("courier");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role !== "admin") {
        toast.error("Доступ запрещён");
        router.push("/");
        return;
      }
      loadData();
    } else if (currentUser === null) {
      router.push("/auth/login");
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchAnalytics();
    }
  }, [currentUser, analyticsPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, tasksRes] = await Promise.all([
        supabase.from("users").select("*").order("created_at", { ascending: false }),
        supabase.from("tasks").select("status")
      ]);

      if (usersRes.error) throw usersRes.error;
      
      const loadedUsers = (usersRes.data || []).map(u => ({
        ...u,
        role: (u.role || "courier") as "courier" | "dispatcher" | "admin",
        status: (u.status || "active") as "active" | "blocked"
      }));
      
      setUsers(loadedUsers);

      const tasks = tasksRes.data || [];
      
      setStats({
        totalUsers: loadedUsers.length,
        activeCouriers: loadedUsers.filter(u => u.role === "courier" && u.status === "active").length,
        dispatchers: loadedUsers.filter(u => u.role === "dispatcher").length,
        admins: loadedUsers.filter(u => u.role === "admin").length,
        activeTasks: tasks.filter(t => t.status === "in_progress").length,
        completedTasks: tasks.filter(t => t.status === "delivered").length
      });
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [analytics, leaders] = await Promise.all([
        dispatcherService.getAnalytics(analyticsPeriod),
        dispatcherService.getCourierLeaderboard(analyticsPeriod),
      ]);
      
      setAnalyticsData(analytics);
      setLeaderboard(leaders);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const createNewUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserFullName) {
      toast.error("Заполните все поля");
      return;
    }

    setCreating(true);
    try {
      // MOCK MODE: Эмулируем создание пользователя без реального Admin API
      const mockUserId = `mock-user-${Date.now()}`;
      
      // Создаем локальный объект пользователя
      const newUser: User = {
        id: mockUserId,
        email: newUserEmail,
        full_name: newUserFullName,
        role: newUserRole,
        status: "active",
        created_at: new Date().toISOString(),
      };

      // Добавляем в локальный список пользователей
      setUsers(prev => [newUser, ...prev]);
      
      // Обновляем статистику
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers + 1,
        activeCouriers: newUserRole === "courier" ? prev.activeCouriers + 1 : prev.activeCouriers,
        dispatchers: newUserRole === "dispatcher" ? prev.dispatchers + 1 : prev.dispatchers,
        admins: newUserRole === "admin" ? prev.admins + 1 : prev.admins,
      }));

      toast.success(`✅ Пользователь ${newUserEmail} создан (MOCK MODE)!`);
      
      // Reset form
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserFullName("");
      setNewUserRole("courier");
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Ошибка создания пользователя");
    } finally {
      setCreating(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: "courier" | "dispatcher" | "admin") => {
    try {
      // MOCK MODE: Обновляем локально без реального запроса к Supabase
      const oldUser = users.find(u => u.id === userId);
      if (!oldUser) return;

      // Обновляем локальный список
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      
      // Обновляем статистику
      setStats(prev => {
        const newStats = { ...prev };
        
        // Уменьшаем старую роль
        if (oldUser.role === "courier") newStats.activeCouriers -= 1;
        if (oldUser.role === "dispatcher") newStats.dispatchers -= 1;
        if (oldUser.role === "admin") newStats.admins -= 1;
        
        // Увеличиваем новую роль
        if (newRole === "courier") newStats.activeCouriers += 1;
        if (newRole === "dispatcher") newStats.dispatchers += 1;
        if (newRole === "admin") newStats.admins += 1;
        
        return newStats;
      });

      toast.success("✅ Роль успешно изменена (MOCK MODE)");
    } catch (error) {
      console.error("Error changing role:", error);
      toast.error("Ошибка изменения роли");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    
    try {
      // MOCK MODE: Обновляем локально без реального запроса к Supabase
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus as any } : u));
      
      toast.success(newStatus === "blocked" ? "🚫 Пользователь заблокирован (MOCK MODE)" : "✅ Пользователь разблокирован (MOCK MODE)");
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Ошибка изменения статуса");
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "destructive" | "default" | "secondary"> = {
      admin: "destructive",
      dispatcher: "default",
      courier: "secondary"
    };

    const labels: Record<string, string> = {
      admin: "👑 Админ",
      dispatcher: "📋 Диспетчер",
      courier: "🚚 Курьер"
    };

    return <Badge variant={variants[role] || "secondary"}>{labels[role] || role}</Badge>;
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
    <Layout title="Админ-панель">
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
              <div className="text-2xl font-bold">{stats.activeCouriers}</div>
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">📊 Аналитика</h2>
            <Select value={analyticsPeriod} onValueChange={(v: any) => setAnalyticsPeriod(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">За день</SelectItem>
                <SelectItem value="week">За неделю</SelectItem>
                <SelectItem value="month">За месяц</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {analyticsData && (
            <div className="grid gap-4 md:grid-cols-2">
              <StatsChart
                title="📦 Доставки по дням"
                data={analyticsData.deliveriesByDay || []}
                valueSuffix=" дост."
              />
              <StatsChart
                title="🛣️ Километраж"
                data={analyticsData.kmByDay || []}
                valueSuffix=" км"
              />
            </div>
          )}

          <CourierLeaderboard couriers={leaderboard} period={analyticsPeriod} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">👥 Управление пользователями</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Создать пользователя
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать нового пользователя</DialogTitle>
                  <DialogDescription>
                    Создайте нового курьера, диспетчера или администратора
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль</Label>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Минимум 6 символов"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Полное имя</Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullname"
                        placeholder="Иван Иванов"
                        value={newUserFullName}
                        onChange={(e) => setNewUserFullName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Роль</Label>
                    <Select value={newUserRole} onValueChange={(v: any) => setNewUserRole(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="courier">🚚 Курьер</SelectItem>
                        <SelectItem value="dispatcher">📋 Диспетчер</SelectItem>
                        <SelectItem value="admin">👑 Администратор</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={creating}>
                    Отмена
                  </Button>
                  <Button onClick={createNewUser} disabled={creating}>
                    {creating ? "Создание..." : "Создать"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {users.map((user) => (
            <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card gap-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.photo_url || undefined} />
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
              
              <div className="flex gap-2 items-center">
                <select
                  value={user.role}
                  onChange={(e) => changeUserRole(user.id, e.target.value as any)}
                  className="px-3 py-2 border rounded-md text-sm bg-background"
                >
                  <option value="courier">Курьер</option>
                  <option value="dispatcher">Диспетчер</option>
                  <option value="admin">Админ</option>
                </select>
                
                <Button
                  variant={user.status === "active" ? "destructive" : "default"}
                  size="sm"
                  onClick={() => toggleUserStatus(user.id, user.status)}
                >
                  {user.status === "active" ? "Заблокировать" : "Разблокировать"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}