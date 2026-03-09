import { useEffect, useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardStats, Task } from "@/types";
import { supabase } from "@/lib/supabase";
import { Package, TrendingUp, MapPin, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { taskService } from "@/services/taskService";
import { deliveryService } from "@/services/deliveryService";
import { locationService } from "@/services/locationService";
import { TaskSwipeCard } from "@/components/TaskSwipeCard";
import { notificationService } from "@/services/notificationService";
import { confettiEffects } from "@/lib/confetti";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

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
  const [isOnShift, setIsOnShift] = useState(false);

  useEffect(() => {
    if (user) {
      setIsOnShift(user.is_on_shift || false);
      fetchDashboardData();
      
      // Request notification permission
      notificationService.requestPermission();
      
      // Subscribe to personal notifications
      const unsubscribeNotifications = notificationService.subscribeToNewTasks(user.id, (newTask) => {
        toast.success(`🚚 Новое задание: ${newTask.address}`);
        notificationService.playSound("info");
        fetchDashboardData();
      });

      // Start location tracking when shift is on
      if (user.is_on_shift && !locationTrackingId) {
        const trackingId = locationService.startTracking(user.id);
        setLocationTrackingId(trackingId);
      }

      // Subscribe to realtime task updates
      const unsubscribe = taskService.subscribeToTasks(user.id, () => {
        fetchDashboardData();
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

  // Periodic refresh every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const statsData = await deliveryService.getTodayStats(user.id);
      setStats(statsData);

      const tasksData = await taskService.getTodayTasks(user.id);
      setNextTasks(tasksData.filter(t => t.status !== 'delivered'));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTaskAction = async (task: Task, action: 'complete' | 'problem') => {
    if (!user) return;
    
    setNextTasks(prev => prev.filter(t => t.id !== task.id));
    
    try {
      if (action === 'complete') {
        if (task.status === 'pending') {
           await taskService.updateTaskStatus(task.id, 'in_progress');
           toast.success("Задание взято в работу");
           notificationService.playSound("success");
           fetchDashboardData(); 
        } else {
           await taskService.updateTaskStatus(task.id, 'delivered');
           toast.success("Задание выполнено! 🎉");
           notificationService.playSound("success");
           
           const remainingTasks = nextTasks.filter(t => t.id !== task.id);
           if (remainingTasks.length === 0) {
             confettiEffects.celebrate();
             notificationService.show({
               title: "🏆 Все задания выполнены!",
               body: "Отличная работа за сегодня!",
               type: "achievement",
             });
           }
        }
      } else {
        toast.error("Сообщено о проблеме");
        notificationService.playSound("error");
      }
      
      fetchDashboardData();
    } catch (e) {
      toast.error("Ошибка обновления");
      fetchDashboardData();
    }
  };

  const toggleShift = async () => {
    if (!user) return;
    
    try {
      const newShiftStatus = !isOnShift;
      
      const { error } = await supabase
        .from('users')
        .update({ is_on_shift: newShiftStatus })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setIsOnShift(newShiftStatus);
      
      if (newShiftStatus) {
        const trackingId = locationService.startTracking(user.id);
        setLocationTrackingId(trackingId);
        toast.success("✅ Смена начата! Удачной работы!");
        notificationService.playSound("success");
      } else {
        if (locationTrackingId) {
          locationService.stopTracking(locationTrackingId);
          setLocationTrackingId(null);
        }
        toast.success("👋 Смена завершена! Отличная работа!");
        notificationService.playSound("info");
      }
    } catch (error) {
      console.error("Error toggling shift:", error);
      toast.error("Ошибка переключения смены");
    }
  };

  if (loading) {
    return (
      <Layout title="Загрузка...">
        <div className="p-4 space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </Layout>
    );
  }

  const completionRate = stats.totalTasksToday > 0 
    ? Math.round((stats.deliveredToday / stats.totalTasksToday) * 100) 
    : 0;

  return (
    <Layout title="Дашборд | КурьерПро PRO">
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="p-4 space-y-6 max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Привет, {user?.full_name?.split(" ")[0] || "Курьер"}! 👋
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <Button 
              variant={isOnShift ? "destructive" : "default"} 
              size="sm"
              onClick={toggleShift}
              className="shadow-lg hover-lift"
            >
              {isOnShift ? "Завершить смену" : "Начать смену"}
            </Button>
          </div>

          {/* Shift Status Banner */}
          {isOnShift && (
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <div className="flex-1">
                  <p className="font-semibold text-green-700 dark:text-green-400">Смена активна</p>
                  <p className="text-xs text-muted-foreground">Ваше местоположение отслеживается</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="shadow-md hover-lift card-appear bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <span className="text-3xl font-bold">{stats.deliveredToday}/{stats.totalTasksToday}</span>
                <span className="text-xs text-muted-foreground">Доставлено</span>
                {stats.totalTasksToday > 0 && (
                  <div className="w-full mt-2">
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">{completionRate}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="shadow-md hover-lift card-appear bg-gradient-to-br from-green-500/5 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.earnedToday}₽</span>
                <span className="text-xs text-muted-foreground">Заработано</span>
              </CardContent>
            </Card>
          </div>

          {/* Next Delivery / Swipe Deck */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {nextTasks.length > 0 ? `Ваши задания (${nextTasks.length})` : "Нет активных заданий"}
              </h2>
              {nextTasks.length > 0 && (
                <Link href="/route" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Карта маршрута →
                </Link>
              )}
            </div>
            
            <div className="relative min-h-[200px]">
              {nextTasks.length > 0 ? (
                <div className="space-y-3">
                  {nextTasks.slice(0, 3).map((task, index) => (
                    <TaskSwipeCard 
                      key={task.id} 
                      task={task}
                      onSwipeRight={(t) => handleTaskAction(t, 'complete')}
                      onSwipeLeft={(t) => handleTaskAction(t, 'problem')}
                      style={{ zIndex: 10 - index }}
                    />
                  ))}
                  {nextTasks.length > 3 && (
                    <div className="text-center py-3">
                      <Link href="/route" className="text-sm text-primary hover:underline">
                        И ещё {nextTasks.length - 3} заданий... →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="border-dashed border-2">
                  <CardContent className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Всё доставлено! 🎉</h3>
                    <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                      Отличная работа! Ожидайте новых назначений от диспетчера.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/route" className="block">
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:shadow-xl transition-all hover-lift group">
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[120px]">
                  <MapPin className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-lg">Маршрут</span>
                  <span className="text-xs opacity-90 mt-1">Карта доставок</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/boxes" className="block">
              <Card className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground hover:shadow-xl transition-all hover-lift group">
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[120px]">
                  <Package className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-lg">Мои коробки</span>
                  <span className="text-xs opacity-90 mt-1">Текущие посылки</span>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Additional Quick Links */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/history" className="block">
              <Card className="hover:shadow-md transition-shadow hover-lift">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">История</p>
                    <p className="text-xs text-muted-foreground">Доставки за период</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/profile" className="block">
              <Card className="hover:shadow-md transition-shadow hover-lift">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Профиль</p>
                    <p className="text-xs text-muted-foreground">Настройки и статистика</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}