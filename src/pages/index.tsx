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
import { TaskSwipeCard } from "@/components/TaskSwipeCard";
import { notificationService } from "@/services/notificationService";

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
      
      // Request notification permission
      notificationService.requestPermission();
      
      // Subscribe to personal notifications
      const unsubscribeNotifications = notificationService.subscribeToNewTasks(user.id, (newTask) => {
        toast.success(`🚚 Новое задание: ${newTask.address}`);
        notificationService.playSound("info");
        setNextTasks(prev => [newTask, ...prev]);
        setStats(prev => ({ ...prev, totalTasksToday: prev.totalTasksToday + 1 }));
      });

      // Start location tracking when shift is on
      if (user.is_on_shift && !locationTrackingId) {
        const trackingId = locationService.startTracking(user.id);
        setLocationTrackingId(trackingId);
      }

      // Subscribe to realtime task updates
      const unsubscribe = taskService.subscribeToTasks(user.id, () => {
        console.log("Realtime update received");
        fetchDashboardData(); // Refresh data on any change
      });

      return () => {
        unsubscribe();
        unsubscribeNotifications();
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

      // Fetch active tasks for swipe deck
      const tasksData = await taskService.getTodayTasks(user.id);
      // Filter out completed tasks for the main deck
      setNextTasks(tasksData.filter(t => t.status !== 'delivered'));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTaskAction = async (task: Task, action: 'complete' | 'problem') => {
    if (!user) return;
    
    // Optimistic update
    setNextTasks(prev => prev.filter(t => t.id !== task.id));
    
    try {
      if (action === 'complete') {
        if (task.status === 'pending') {
           await taskService.updateTaskStatus(task.id, 'in_progress');
           toast.success("Задание взято в работу");
           notificationService.playSound("success");
           // Add back to top if it was just started
           fetchDashboardData(); 
        } else {
           await taskService.updateTaskStatus(task.id, 'delivered');
           toast.success("Задание выполнено! 🎉");
           notificationService.playSound("success");
           notificationService.notifyAllTasksCompleted(stats.deliveredToday + 1);
        }
      } else {
        toast.error("Сообщено о проблеме");
        notificationService.playSound("error");
        // Logic to report problem would go here
      }
      
      fetchDashboardData();
    } catch (e) {
      toast.error("Ошибка обновления");
      fetchDashboardData(); // Revert
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

        {/* Next Delivery / Swipe Deck */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-lg">
              {nextTasks.length > 0 ? "Ваши задания" : "Нет активных заданий"}
            </h2>
            <Link href="/route" className="text-sm text-primary hover:underline">
              Карта
            </Link>
          </div>
          
          <div className="relative min-h-[200px]">
            {nextTasks.length > 0 ? (
              <div className="space-y-4">
                {nextTasks.slice(0, 3).map((task) => (
                  <TaskSwipeCard 
                    key={task.id} 
                    task={task}
                    onSwipeRight={(t) => handleTaskAction(t, 'complete')}
                    onSwipeLeft={(t) => handleTaskAction(t, 'problem')}
                  />
                ))}
                {nextTasks.length > 3 && (
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    И ещё {nextTasks.length - 3} заданий...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-bold text-lg">Всё доставлено!</h3>
                <p className="text-muted-foreground text-sm max-w-[200px] mx-auto mt-1">
                  Отличная работа. Ожидайте новых назначений от диспетчера.
                </p>
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