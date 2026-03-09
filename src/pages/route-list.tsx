import { useEffect, useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Task } from "@/types";
import { taskService } from "@/services/taskService";
import { MapPin, Phone, Navigation, Package, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { toast } from "sonner";
import { notificationService } from "@/services/notificationService";
import Link from "next/link";

type TimeSlot = "morning" | "afternoon" | "evening";

const TIME_SLOTS = {
  morning: { label: "Утро", time: "09:00–13:00", range: [9, 13] },
  afternoon: { label: "День", time: "13:00–18:00", range: [13, 18] },
  evening: { label: "Вечер", time: "18:00–22:00", range: [18, 22] },
};

export default function RouteList() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TimeSlot>("morning");

  useEffect(() => {
    if (user) {
      fetchTasks();
      
      const unsubscribe = taskService.subscribeToTasks(user.id, () => {
        fetchTasks();
      });

      return () => unsubscribe();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      const data = await taskService.getTodayTasks(user.id);
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Ошибка загрузки заданий");
    } finally {
      setLoading(false);
    }
  };

  const getTasksByTimeSlot = (slot: TimeSlot) => {
    const [startHour, endHour] = TIME_SLOTS[slot].range;
    return tasks.filter(task => {
      const hour = new Date(task.scheduled_time).getHours();
      return hour >= startHour && hour < endHour;
    });
  };

  const handleStatusChange = async (taskId: string, newStatus: "in_progress" | "delivered") => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      
      if (newStatus === "delivered") {
        toast.success("✅ Доставка завершена!");
        notificationService.playSound("success");
      } else {
        toast.success("🚀 В путь!");
        notificationService.playSound("info");
      }
      
      fetchTasks();
    } catch (error) {
      toast.error("Ошибка обновления статуса");
    }
  };

  const openNavigation = (lat: number, lon: number) => {
    window.open(`yandexmaps://maps.yandex.ru/?pt=${lon},${lat}&z=12&l=map`, "_blank");
  };

  const renderTaskCard = (task: Task) => {
    const isPending = task.status === "pending";
    const isInProgress = task.status === "in_progress";
    const isDelivered = task.status === "delivered";

    return (
      <Card key={task.id} className="hover-lift card-appear">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-lg">{task.client_name || "Клиент"}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(task.scheduled_time)}
              </p>
            </div>
            <Badge variant={isDelivered ? "default" : isInProgress ? "secondary" : "outline"}>
              {isDelivered ? "Доставлено" : isInProgress ? "В работе" : "Ожидает"}
            </Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
              <span className="line-clamp-2">{task.address}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                {task.boxes_count} кор.
              </span>
              {task.client_phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {task.client_phone}
                </span>
              )}
            </div>
          </div>

          {!isDelivered && (
            <div className="flex gap-2">
              {isPending && (
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleStatusChange(task.id, "in_progress")}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  В путь
                </Button>
              )}
              
              {isInProgress && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (task.latitude && task.longitude) {
                        openNavigation(task.latitude, task.longitude);
                      }
                    }}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Карта
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleStatusChange(task.id, "delivered")}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Доставлено
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Layout title="Загрузка...">
        <div className="p-4">Загрузка маршрута...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Маршрутный лист | КурьерПро PRO">
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="p-4 max-w-2xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Маршрутный лист</h1>
            <Link href="/map">
              <Button size="sm" variant="outline">
                <MapPin className="w-4 h-4 mr-2" />
                На карте
              </Button>
            </Link>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TimeSlot)}>
            <TabsList className="grid w-full grid-cols-3">
              {Object.entries(TIME_SLOTS).map(([key, slot]) => {
                const count = getTasksByTimeSlot(key as TimeSlot).length;
                return (
                  <TabsTrigger key={key} value={key}>
                    {slot.label}
                    {count > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(TIME_SLOTS).map(([key, slot]) => {
              const slotTasks = getTasksByTimeSlot(key as TimeSlot);
              
              return (
                <TabsContent key={key} value={key} className="space-y-3 mt-4">
                  <div className="text-sm text-muted-foreground text-center mb-3">
                    {slot.time} • {slotTasks.length} заданий
                  </div>
                  
                  {slotTasks.length > 0 ? (
                    slotTasks.map(renderTaskCard)
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          Нет заданий на это время
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}