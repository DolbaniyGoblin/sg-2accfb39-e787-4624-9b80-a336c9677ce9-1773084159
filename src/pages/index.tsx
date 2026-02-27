import { useEffect, useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardStats, Task } from "@/types";
import { supabase } from "@/lib/supabase";
import { Package, TrendingUp, MapPin, Truck, AlertTriangle } from "lucide-react";
import { formatTime, cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { taskService } from "@/services/taskService";
import { deliveryService } from "@/services/deliveryService";
import { locationService } from "@/services/locationService";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    deliveredToday: 0,
    totalTasksToday: 0,
    earnedToday: 0,
    kmToday: 0,
  });
  const [nextTasks, setNextTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationTrackingId, setLocationTrackingId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      
      // Start location tracking when shift is on
      if (user.is_on_shift && !locationTrackingId) {
        const trackingId = locationService.startTracking(user.id);
        setLocationTrackingId(trackingId);
      }

      // Subscribe to realtime task updates
      const unsubscribe = taskService.subscribeToTasks(user.id, () => {
        console.log("Realtime update received");
        fetchDashboardData(); // Refresh data on any change
        toast.info("Данные обновлены");
      });

      return () => {
        unsubscribe();
        if (locationTrackingId) {
          locationService.stopTracking(locationTrackingId);
        }
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch real stats from Supabase
      const statsData = await deliveryService.getTodayStats(user.id);
      setStats(statsData);

      // Fetch next 3 tasks
      const tasksData = await taskService.getNextTasks(user.id, 3);
      setNextTasks(tasksData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Keep mock data as fallback
    } finally {
      setLoading(false);
    }
  };

  const toggleShift = async () => {
    if (!user) return;
    
    // Toggle shift logic here
    toast.success(user.is_on_shift ? "Смена завершена" : "Смена начата");
    // Update local state optimistic update would go here
  };

  if (loading) {
    return (
      <Layout title="Загрузка...">
        <div className="p-4 space-y-4 animate-pulse">
          <div className="h-20 bg-muted rounded-lg" />
          <div className="h-40 bg-muted rounded-lg" />
          <div className="h-40 bg-muted rounded-lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Дашборд | КурьерПро PRO">
      <div className="p-4 space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Привет, {user?.full_name?.split(" ")[0] || "Курьер"}! 👋</h1>
            <p className="text-sm text-muted-foreground">Хорошего рабочего дня</p>
          </div>
          <Button 
            variant={user?.is_on_shift ? "destructive" : "default"} 
            size="sm"
            onClick={toggleShift}
          >
            {user?.is_on_shift ? "Завершить смену" : "Начать смену"}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-sm">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Package className="w-5 h-5 text-primary mb-2" />
              <span className="text-2xl font-bold">{stats.deliveredToday}/{stats.totalTasksToday}</span>
              <span className="text-xs text-muted-foreground">Коробок</span>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
              <span className="text-2xl font-bold">{stats.earnedToday}₽</span>
              <span className="text-xs text-muted-foreground">Заработано</span>
            </CardContent>
          </Card>
        </div>

        {/* Next Delivery */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-lg">Ближайшие доставки</h2>
            <Link href="/route" className="text-sm text-primary hover:underline">
              Весь маршрут
            </Link>
          </div>
          
          <div className="space-y-3">
            {nextTasks.length > 0 ? (
              nextTasks.map((task) => (
                <Card key={task.id} className="border-l-4 border-l-primary shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
                        {formatTime(task.scheduled_time)}
                      </span>
                      <span className="text-xs text-muted-foreground">{task.boxes_count} кор.</span>
                    </div>
                    <h3 className="font-bold mb-1 truncate">{task.client_name}</h3>
                    <div className="flex items-start text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-1 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{task.address}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">Заданий пока нет</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
           <Link href="/route" className="block">
            <Card className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[100px]">
                <MapPin className="w-8 h-8 mb-2" />
                <span className="font-bold">Маршрут</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/boxes" className="block">
            <Card className="bg-accent text-accent-foreground hover:bg-accent/90 transition-colors">
              <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[100px]">
                <Package className="w-8 h-8 mb-2" />
                <span className="font-bold">Мои коробки</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </Layout>
  );
}