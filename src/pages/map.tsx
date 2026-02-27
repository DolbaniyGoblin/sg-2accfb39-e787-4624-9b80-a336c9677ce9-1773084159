import { useState, useEffect, useCallback, useMemo } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Navigation, 
  MapPin, 
  Phone, 
  Package, 
  Clock, 
  Shuffle, 
  RotateCcw,
  TrendingDown,
  Zap,
  Route as RouteIcon,
  CheckCircle2,
  ArrowUpDown
} from "lucide-react";
import { taskService } from "@/services/taskService";
import { locationService } from "@/services/locationService";
import type { Task } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

declare global {
  interface Window {
    ymaps: any;
  }
}

// Вспомогательная функция для расчёта расстояния между двумя точками (формула Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Радиус Земли в км
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Алгоритм оптимизации маршрута (Nearest Neighbor с улучшениями)
function optimizeRoute(tasks: Task[], startLat: number, startLng: number): Task[] {
  if (tasks.length <= 1) return tasks;

  const optimized: Task[] = [];
  const remaining = [...tasks];
  let currentLat = startLat;
  let currentLng = startLng;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    remaining.forEach((task, index) => {
      if (!task.latitude || !task.longitude) return;
      const distance = calculateDistance(currentLat, currentLng, task.latitude, task.longitude);
      
      // Учитываем время доставки (приоритет более ранним)
      const timeBonus = new Date(task.scheduled_time).getHours() < 12 ? -0.5 : 0;
      const adjustedDistance = distance + timeBonus;

      if (adjustedDistance < minDistance) {
        minDistance = adjustedDistance;
        nearestIndex = index;
      }
    });

    const nearest = remaining.splice(nearestIndex, 1)[0];
    optimized.push(nearest);
    currentLat = nearest.latitude!;
    currentLng = nearest.longitude!;
  }

  return optimized;
}

// Расчёт общей дистанции маршрута
function calculateTotalDistance(tasks: Task[], startLat: number, startLng: number): number {
  if (tasks.length === 0) return 0;
  
  let total = 0;
  let prevLat = startLat;
  let prevLng = startLng;

  tasks.forEach(task => {
    if (task.latitude && task.longitude) {
      total += calculateDistance(prevLat, prevLng, task.latitude, task.longitude);
      prevLat = task.latitude;
      prevLng = task.longitude;
    }
  });

  return total;
}

export default function MapPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [map, setMap] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [routeLines, setRouteLines] = useState<any[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [draggedTaskIndex, setDraggedTaskIndex] = useState<number | null>(null);

  // Статистика
  const stats = useMemo(() => {
    const total = tasks.length;
    const delivered = tasks.filter(t => t.status === "delivered").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const progress = total > 0 ? (delivered / total) * 100 : 0;
    
    const totalDistance = userLocation 
      ? calculateTotalDistance(orderedTasks, userLocation.lat, userLocation.lng)
      : 0;

    return { total, delivered, inProgress, pending, progress, totalDistance };
  }, [tasks, orderedTasks, userLocation]);

  // Функция загрузки задач
  const loadTasks = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await taskService.getTodayTasks(user.id);
      const activeTasks = data.filter(t => t.status !== "delivered");
      setTasks(activeTasks);
      
      // Инициализируем порядок при первой загрузке
      if (orderedTasks.length === 0 && activeTasks.length > 0) {
        setOrderedTasks(activeTasks);
      }
    } catch (error) {
      console.error("Failed to load tasks", error);
    }
  }, [user?.id, orderedTasks.length]);

  // Загружаем Яндекс.Карты
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(() => {
        setIsMapLoaded(true);
      });
    };
    document.head.appendChild(script);
  }, []);

  // Первичная загрузка и подписка
  useEffect(() => {
    if (!user?.id) return;

    loadTasks();

    const unsubscribe = taskService.subscribeToTasks(user.id, () => {
      loadTasks();
    });

    return () => unsubscribe();
  }, [user?.id, loadTasks]);

  // Отслеживаем геолокацию курьера
  useEffect(() => {
    if (!user?.id) return;

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          await locationService.updateLocation(user.id, latitude, longitude);
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [user?.id]);

  // Инициализируем карту
  useEffect(() => {
    if (!isMapLoaded || map) return;

    const initialCenter = userLocation 
      ? [userLocation.lat, userLocation.lng] 
      : [55.751244, 37.618423];

    const ymap = new window.ymaps.Map("map-container", {
      center: initialCenter,
      zoom: 12,
      controls: ["zoomControl", "typeSelector", "fullscreenControl"]
    });

    setMap(ymap);
  }, [isMapLoaded, map, userLocation]);

  // Добавляем метки на карту
  useEffect(() => {
    if (!map || !orderedTasks.length) return;

    map.geoObjects.removeAll();
    setRouteLines([]);

    // Добавляем пульсирующую метку текущего местоположения
    if (userLocation) {
      const userPlacemark = new window.ymaps.Placemark(
        [userLocation.lat, userLocation.lng],
        {
          balloonContent: "<strong>🚗 Вы здесь</strong>",
          iconCaption: "Я"
        },
        {
          preset: "islands#blueCircleDotIcon",
          iconColor: "#3b82f6"
        }
      );
      map.geoObjects.add(userPlacemark);
    }

    // Добавляем метки доставок с нумерацией
    const lines: any[] = [];
    let prevCoords = userLocation ? [userLocation.lat, userLocation.lng] : null;

    orderedTasks.forEach((task, index) => {
      if (!task.latitude || !task.longitude) return;

      const coords = [task.latitude, task.longitude];
      const timeString = new Date(task.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const hour = new Date(task.scheduled_time).getHours();
      
      // Определяем время суток для цвета фона
      let timeOfDay = "🌅 Утро";
      let timeBgColor = "#fef3c7";
      if (hour >= 13 && hour < 18) {
        timeOfDay = "☀️ День";
        timeBgColor = "#fef08a";
      } else if (hour >= 18) {
        timeOfDay = "🌆 Вечер";
        timeBgColor = "#fed7aa";
      }

      // Цвет метки по статусу
      let iconColor = "#ef4444"; // pending - красный
      let preset = "islands#redCircleIcon";
      if (task.status === "in_progress") {
        iconColor = "#f97316"; // in_progress - оранжевый
        preset = "islands#orangeCircleIcon";
      } else if (task.status === "delivered") {
        iconColor = "#22c55e"; // delivered - зелёный
        preset = "islands#greenCircleIcon";
      }

      // Размер иконки зависит от количества коробок
      const iconSize = Math.min(50, 30 + task.boxes_count * 2);

      const placemark = new window.ymaps.Placemark(
        coords,
        {
          balloonContent: `
            <div style="padding: 12px; min-width: 200px;">
              <div style="background: ${timeBgColor}; padding: 6px; border-radius: 6px; margin-bottom: 8px;">
                <strong style="font-size: 13px;">${timeOfDay} • ${timeString}</strong>
              </div>
              <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600;">📍 ${task.address}</h3>
              <p style="margin: 6px 0; font-size: 13px;"><strong>📦 Коробок:</strong> ${task.boxes_count} шт.</p>
              <p style="margin: 6px 0; font-size: 13px;"><strong>👤 Клиент:</strong> ${task.client_name}</p>
              <p style="margin: 6px 0; font-size: 13px;"><strong>📞 Телефон:</strong> ${task.client_phone}</p>
              ${task.status === "delivered" ? '<p style="margin: 6px 0; font-size: 13px; color: #22c55e;"><strong>✅ Доставлено</strong></p>' : ''}
            </div>
          `,
          iconCaption: `${index + 1}. ${task.boxes_count} кор.`
        },
        {
          preset: preset,
          iconColor: iconColor
        }
      );

      placemark.events.add("click", () => {
        setSelectedTask(task);
      });

      map.geoObjects.add(placemark);

      // Рисуем линию маршрута
      if (prevCoords && task.status !== "delivered") {
        const polyline = new window.ymaps.Polyline(
          [prevCoords, coords],
          {
            balloonContent: `Расстояние: ${calculateDistance(prevCoords[0], prevCoords[1], coords[0], coords[1]).toFixed(2)} км`
          },
          {
            strokeColor: task.status === "in_progress" ? "#f97316" : "#3b82f6",
            strokeWidth: 4,
            strokeOpacity: 0.7
          }
        );
        map.geoObjects.add(polyline);
        lines.push(polyline);
      }

      prevCoords = coords;
    });

    setRouteLines(lines);
  }, [map, orderedTasks, userLocation]);

  // Оптимизация маршрута
  const handleOptimize = () => {
    if (!userLocation) {
      toast.error("Не удалось определить ваше местоположение");
      return;
    }

    setIsOptimizing(true);
    
    setTimeout(() => {
      const activeTasks = orderedTasks.filter(t => t.status !== "delivered");
      const optimized = optimizeRoute(activeTasks, userLocation.lat, userLocation.lng);
      const delivered = orderedTasks.filter(t => t.status === "delivered");
      
      setOrderedTasks([...optimized, ...delivered]);
      setIsOptimizing(false);
      
      const distance = calculateTotalDistance(optimized, userLocation.lat, userLocation.lng);
      toast.success(`Маршрут оптимизирован! Общая дистанция: ${distance.toFixed(1)} км`);
    }, 800);
  };

  // Случайная перестановка
  const handleShuffle = () => {
    const activeTasks = orderedTasks.filter(t => t.status !== "delivered");
    const delivered = orderedTasks.filter(t => t.status === "delivered");
    
    const shuffled = [...activeTasks].sort(() => Math.random() - 0.5);
    setOrderedTasks([...shuffled, ...delivered]);
    
    toast.info("Порядок точек изменён");
  };

  // Сброс порядка
  const handleReset = () => {
    setOrderedTasks([...tasks]);
    toast.info("Порядок сброшен к исходному");
  };

  // Drag & Drop функции
  const handleDragStart = (index: number) => {
    setDraggedTaskIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedTaskIndex === null || draggedTaskIndex === dropIndex) return;

    const newTasks = [...orderedTasks];
    const [draggedTask] = newTasks.splice(draggedTaskIndex, 1);
    newTasks.splice(dropIndex, 0, draggedTask);
    
    setOrderedTasks(newTasks);
    setDraggedTaskIndex(null);
    toast.success("Порядок точек обновлён");
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const buildFullRoute = async () => {
    if (!map || !userLocation || orderedTasks.length === 0) return;

    // Очищаем предыдущие маршруты
    map.geoObjects.each((obj: any) => {
      if (obj.geometry && obj.geometry.getType() === "LineString") {
        map.geoObjects.remove(obj);
      }
    });

    const points: [number, number][] = [[userLocation.lat, userLocation.lng]];
    
    orderedTasks
      .filter(t => t.status !== "delivered" && t.latitude && t.longitude)
      .forEach(task => {
        points.push([task.latitude!, task.longitude!]);
      });

    if (points.length < 2) {
      toast.error("Недостаточно точек для построения маршрута");
      return;
    }

    const multiRoute = new window.ymaps.multiRouter.MultiRoute(
      {
        referencePoints: points,
        params: { routingMode: "auto" }
      },
      {
        boundsAutoApply: true,
        wayPointStartIconColor: "#3b82f6",
        wayPointFinishIconColor: "#ef4444",
        routeActiveStrokeColor: "#3b82f6",
        routeActiveStrokeWidth: 5,
        routeActiveStrokeOpacity: 0.8
      }
    );

    map.geoObjects.add(multiRoute);
    toast.success("Маршрут построен!");
  };

  return (
    <Layout>
      <div className="space-y-4 p-4">
        <div>
          <h1 className="text-3xl font-bold">🗺️ Карта доставок</h1>
          <p className="text-muted-foreground">Оптимизация и построение маршрута</p>
        </div>

        {/* Статистика */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Всего точек</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{stats.delivered}</p>
                <p className="text-xs text-muted-foreground">Доставлено</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">В пути</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Ожидают</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Прогресс выполнения</span>
                <span className="font-medium">{stats.progress.toFixed(0)}%</span>
              </div>
              <Progress value={stats.progress} className="h-2" />
            </div>

            {stats.totalDistance > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Общая дистанция:</span>
                  </div>
                  <span className="text-lg font-bold">{stats.totalDistance.toFixed(1)} км</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Управление маршрутом */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RouteIcon className="h-5 w-5" />
              Управление маршрутом
            </CardTitle>
            <CardDescription>Оптимизируйте порядок доставок</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button 
                onClick={handleOptimize}
                disabled={isOptimizing || !userLocation}
                className="w-full"
                variant="default"
              >
                <Zap className="mr-2 h-4 w-4" />
                {isOptimizing ? "Оптимизация..." : "Оптимизировать"}
              </Button>
              
              <Button 
                onClick={buildFullRoute}
                disabled={!userLocation || orderedTasks.length === 0}
                className="w-full"
                variant="secondary"
              >
                <Navigation className="mr-2 h-4 w-4" />
                Построить путь
              </Button>
              
              <Button 
                onClick={handleShuffle}
                className="w-full"
                variant="outline"
              >
                <Shuffle className="mr-2 h-4 w-4" />
                Случайно
              </Button>
              
              <Button 
                onClick={handleReset}
                className="w-full"
                variant="outline"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Сбросить
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
              💡 <strong>Совет:</strong> Перетаскивайте точки в списке ниже для ручной настройки порядка
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Карта */}
          <Card className="lg:col-span-2 overflow-hidden">
            <CardContent className="p-0">
              <div id="map-container" className="w-full h-[500px] lg:h-[650px] bg-muted" />
            </CardContent>
          </Card>

          {/* Список точек с Drag & Drop */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Порядок точек
              </CardTitle>
              <CardDescription>Перетащите для изменения</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[550px] overflow-y-auto">
                {orderedTasks.map((task, index) => (
                  <div
                    key={task.id}
                    draggable={task.status !== "delivered"}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      task.status === "delivered" 
                        ? "opacity-50 cursor-not-allowed" 
                        : "cursor-move hover:shadow-md hover:border-primary"
                    } ${draggedTaskIndex === index ? "opacity-50 scale-95" : ""}`}
                    onClick={() => {
                      setSelectedTask(task);
                      if (task.latitude && task.longitude && map) {
                        map.setCenter([task.latitude, task.longitude], 15, {
                          duration: 300
                        });
                      }
                    }}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      task.status === "delivered" 
                        ? "bg-green-500 text-white" 
                        : task.status === "in_progress"
                        ? "bg-orange-500 text-white"
                        : "bg-red-500 text-white"
                    }`}>
                      {task.status === "delivered" ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{task.address}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(task.scheduled_time)}</span>
                        <Package className="h-3 w-3 ml-1" />
                        <span>{task.boxes_count} шт.</span>
                      </div>
                    </div>
                    {task.status !== "delivered" && (
                      <Badge variant="outline" className="text-xs">
                        Перетащить
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Информация о выбранной точке */}
        {selectedTask && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Выбранная доставка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatTime(selectedTask.scheduled_time)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedTask.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedTask.boxes_count} коробок</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium">Клиент</p>
                <p className="text-sm text-muted-foreground">{selectedTask.client_name}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${selectedTask.client_phone}`} className="text-primary hover:underline">
                    {selectedTask.client_phone}
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Badge variant={
                  selectedTask.status === "pending" ? "destructive" :
                  selectedTask.status === "in_progress" ? "default" :
                  "secondary"
                }>
                  {selectedTask.status === "pending" ? "Ожидает" :
                   selectedTask.status === "in_progress" ? "В пути" :
                   "Доставлено"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}