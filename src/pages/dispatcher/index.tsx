import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Package, Users, Clock, Map } from "lucide-react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type User = Database["public"]["Tables"]["users"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];
type DeliveryPoint = Database["public"]["Tables"]["delivery_points"]["Row"];

// Mock data для тестирования
const MOCK_COURIERS: User[] = [
  {
    id: "mock-courier-1",
    email: "ivan@courier.com",
    full_name: "Иван Петров",
    role: "courier",
    status: "active",
    rating: 4.8,
    phone: "+7 (999) 123-45-67",
    avatar_url: null,
    photo_url: null,
    is_on_shift: true,
    experience_months: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "mock-courier-2",
    email: "maria@courier.com",
    full_name: "Мария Сидорова",
    role: "courier",
    status: "active",
    rating: 4.9,
    phone: "+7 (999) 234-56-78",
    avatar_url: null,
    photo_url: null,
    is_on_shift: true,
    experience_months: 24,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "mock-courier-3",
    email: "alex@courier.com",
    full_name: "Алексей Козлов",
    role: "courier",
    status: "inactive",
    rating: 4.7,
    phone: "+7 (999) 345-67-89",
    avatar_url: null,
    photo_url: null,
    is_on_shift: false,
    experience_months: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const MOCK_TASKS: Task[] = [
  {
    id: "mock-task-1",
    courier_id: "mock-courier-1",
    delivery_point_id: "mock-point-1",
    address: "ул. Ленина, 10",
    box_count: 5,
    status: "in_progress",
    client_name: "Магазин 'Продукты'",
    client_phone: "+7 (999) 111-11-11",
    notes: "Позвонить за 10 минут",
    time_slot: null,
    priority: "normal",
    scheduled_time: null,
    latitude: 55.7558,
    longitude: 37.6173,
    created_by: "mock-admin-id",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "mock-task-2",
    courier_id: "mock-courier-2",
    delivery_point_id: "mock-point-2",
    address: "пр. Мира, 25",
    box_count: 3,
    status: "delivered",
    client_name: "Кафе 'Уют'",
    client_phone: "+7 (999) 222-22-22",
    notes: null,
    time_slot: null,
    priority: "normal",
    scheduled_time: null,
    latitude: 55.7858,
    longitude: 37.6373,
    created_by: "mock-admin-id",
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "mock-task-3",
    courier_id: null,
    delivery_point_id: "mock-point-3",
    address: "ул. Южная, 5",
    box_count: 8,
    status: "pending",
    client_name: "Ресторан 'Вкусно'",
    client_phone: "+7 (999) 333-33-33",
    notes: "Срочная доставка",
    time_slot: null,
    priority: "high",
    scheduled_time: null,
    latitude: 55.7258,
    longitude: 37.5973,
    created_by: "mock-admin-id",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
];

const MOCK_POINTS: DeliveryPoint[] = [
  {
    id: "mock-point-1",
    name: "Точка 1 - Центр",
    address: "ул. Ленина, 10",
    latitude: 55.7558,
    longitude: 37.6173,
    contact_name: "Иван Иванов",
    contact_phone: "+7 (999) 111-11-11",
    is_active: true,
    notes: "Вход со двора",
    created_by: "mock-admin-id",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "mock-point-2",
    name: "Точка 2 - Север",
    address: "пр. Мира, 25",
    latitude: 55.7858,
    longitude: 37.6373,
    contact_name: "Петр Петров",
    contact_phone: "+7 (999) 222-22-22",
    is_active: true,
    notes: null,
    created_by: "mock-admin-id",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "mock-point-3",
    name: "Точка 3 - Юг",
    address: "ул. Южная, 5",
    latitude: 55.7258,
    longitude: 37.5973,
    contact_name: "Сергей Сергеев",
    contact_phone: "+7 (999) 333-33-33",
    is_active: true,
    notes: "Домофон 123",
    created_by: "mock-admin-id",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export default function DispatcherDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [couriers, setCouriers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [points, setPoints] = useState<DeliveryPoint[]>([]);

  useEffect(() => {
    // В мок-режиме просто загружаем тестовые данные
    loadMockData();
  }, []);

  const loadMockData = () => {
    setCouriers(MOCK_COURIERS);
    setTasks(MOCK_TASKS);
    setPoints(MOCK_POINTS);
    setLoading(false);
    toast.info("MOCK MODE: Загружены тестовые данные");
  };

  const stats = {
    totalCouriers: couriers.length,
    activeCouriers: couriers.filter(c => c.status === "active").length,
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === "pending").length,
    inProgressTasks: tasks.filter(t => t.status === "in_progress").length,
    completedTasks: tasks.filter(t => t.status === "delivered").length,
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
            <Button onClick={() => router.push("/dispatcher/live-map")} variant="outline" className="gap-2">
              <Map className="h-4 w-4" />
              Карта
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

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <Link href="/dispatcher/add-task">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Plus className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-semibold text-lg">Создать задание</h3>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Добавить новую доставку
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <Link href="/dispatcher/add-point">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <MapPin className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-semibold text-lg">Добавить точку</h3>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Новый адрес доставки
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <Link href="/dispatcher/live-map">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Map className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-semibold text-lg">Карта онлайн</h3>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Мониторинг курьеров
                </p>
              </CardContent>
            </Link>
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
                      task.status === "delivered" ? "default" :
                      task.status === "in_progress" ? "secondary" : "outline"
                    }>
                      {task.status === "delivered" ? "✅ Готово" :
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