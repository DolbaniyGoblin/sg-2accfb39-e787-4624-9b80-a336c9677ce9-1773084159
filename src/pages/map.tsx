import { useState, useEffect, useCallback, useMemo } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Navigation, 
  MapPin, 
  Package, 
  Clock, 
  Zap,
  CheckCircle2,
  Save,
  TrendingUp,
  AlertTriangle,
  Eye,
  EyeOff
} from "lucide-react";
import { taskService } from "@/services/taskService";
import { locationService } from "@/services/locationService";
import { routeService } from "@/services/routeService";
import type { Task } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

declare global {
  interface Window {
    ymaps: any;
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
      if (distance < minDistance) {
        minDistance = distance;
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
  const [map, setMap] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [traceLine, setTraceLine] = useState<any>(null);
  const [showTrace, setShowTrace] = useState(true);
  const [etas, setEtas] = useState<Map<string, Date>>(new Map());

  const nextTask = useMemo(() => {
    return orderedTasks.find(t => t.status !== "delivered");
  }, [orderedTasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const delivered = tasks.filter(t => t.status === "delivered").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const totalDistance = userLocation 
      ? calculateTotalDistance(orderedTasks, userLocation.lat, userLocation.lng)
      : 0;
    return { total, delivered, inProgress, pending, totalDistance };
  }, [tasks, orderedTasks, userLocation]);

  const loadTasks = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await taskService.getTodayTasks(user.id);
      const activeTasks = data.filter(t => t.status !== "delivered");
      const deliveredTasks = data.filter(t => t.status === "delivered");
      
      setTasks(data);
      if (orderedTasks.length === 0 && activeTasks.length > 0) {
        setOrderedTasks([...activeTasks, ...deliveredTasks]);
      }
    } catch (error) {
      console.error("Failed to load tasks", error);
    }
  }, [user?.id, orderedTasks.length]);

  useEffect(() => {
    if (userLocation && orderedTasks.length > 0) {
      const calculatedEtas = routeService.calculateETAs(
        orderedTasks.filter(t => t.status !== "delivered"),
        userLocation.lat,
        userLocation.lng
      );
      setEtas(calculatedEtas);
    }
  }, [orderedTasks, userLocation]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU`;
    script.async = true;
    script.onload = () => window.ymaps.ready(() => setIsMapLoaded(true));
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    loadTasks();
    const unsubscribe = taskService.subscribeToTasks(user.id, loadTasks);
    return () => unsubscribe();
  }, [user?.id, loadTasks]);

  useEffect(() => {
    if (!user?.id) return;
    
    const loadTrace = async () => {
      const history = await routeService.getTodayLocationHistory(user.id);
      if (history.length > 0 && map) {
        drawTrace(history);
      }
    };

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, speed } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          await locationService.updateLocation(user.id, latitude, longitude);
          await routeService.addLocationToHistory(user.id, latitude, longitude, speed || 0);
          
          if (map) loadTrace();

          if (nextTask && nextTask.latitude && nextTask.longitude) {
            const distance = calculateDistance(latitude, longitude, nextTask.latitude, nextTask.longitude);
            if (distance < 0.2) {
              toast.success(`🎯 Вы приближаетесь к точке: ${nextTask.address}`, { duration: 5000 });
            }
          }
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [user?.id, map, nextTask]);

  useEffect(() => {
    if (!isMapLoaded || map) return;
    const initialCenter = userLocation ? [userLocation.lat, userLocation.lng] : [55.751244, 37.618423];
    const ymap = new window.ymaps.Map("map-container", {
      center: initialCenter,
      zoom: 12,
      controls: ["zoomControl", "typeSelector", "fullscreenControl"]
    });
    setMap(ymap);
  }, [isMapLoaded, map, userLocation]);

  const drawTrace = (history: any[]) => {
    if (!map) return;
    
    if (traceLine) {
      map.geoObjects.remove(traceLine);
    }

    if (!showTrace) return;

    const coordinates = history.map(h => [h.latitude, h.longitude]);
    const polyline = new window.ymaps.Polyline(coordinates, {}, {
      strokeColor: "#8b5cf6",
      strokeWidth: 3,
      strokeOpacity: 0.5,
      strokeStyle: "dash"
    });

    map.geoObjects.add(polyline);
    setTraceLine(polyline);
  };

  useEffect(() => {
    if (!map || !orderedTasks.length) return;

    const objectsToRemove: any[] = [];
    map.geoObjects.each((obj: any) => {
      if (obj !== traceLine) objectsToRemove.push(obj);
    });
    objectsToRemove.forEach(obj => map.geoObjects.remove(obj));

    if (userLocation) {
      const userPlacemark = new window.ymaps.Placemark(
        [userLocation.lat, userLocation.lng],
        { balloonContent: "<strong>🚗 Вы здесь</strong>" },
        { preset: "islands#blueCircleDotIcon" }
      );
      map.geoObjects.add(userPlacemark);
    }

    let prevCoords = userLocation ? [userLocation.lat, userLocation.lng] : null;

    orderedTasks.forEach((task, index) => {
      if (!task.latitude || !task.longitude) return;

      const coords = [task.latitude, task.longitude];
      const eta = etas.get(task.id);
      const isLate = eta && new Date(task.scheduled_time) < eta;

      const placemark = new window.ymaps.Placemark(
        coords,
        {
          balloonContent: `
            <div class="p-2 min-w-[200px]">
              <h3 class="font-bold mb-2">${index + 1}. ${task.address}</h3>
              <p>📦 ${task.boxes_count} кор.</p>
              <p>⏰ План: ${new Date(task.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              ${eta ? `<p class="${isLate ? 'text-red-500 font-bold' : 'text-green-600'}">
                🏁 ETA: ${eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>` : ''}
            </div>
          `,
          iconCaption: `${index + 1}`
        },
        {
          preset: task.status === "delivered" ? "islands#greenCircleIcon" : 
                  task.status === "in_progress" ? "islands#orangeCircleIcon" : 
                  "islands#redCircleIcon"
        }
      );

      map.geoObjects.add(placemark);

      if (prevCoords && task.status !== "delivered") {
        const polyline = new window.ymaps.Polyline([prevCoords, coords], {}, {
          strokeColor: "#3b82f6",
          strokeWidth: 3,
          strokeOpacity: 0.8
        });
        map.geoObjects.add(polyline);
        prevCoords = coords;
      }
    });
  }, [map, orderedTasks, userLocation, etas, traceLine]);

  const handleOptimize = () => {
    if (!userLocation) return toast.error("Нет геопозиции");
    setIsOptimizing(true);
    setTimeout(() => {
      const active = orderedTasks.filter(t => t.status !== "delivered");
      const delivered = orderedTasks.filter(t => t.status === "delivered");
      const optimized = optimizeRoute(active, userLocation.lat, userLocation.lng);
      setOrderedTasks([...optimized, ...delivered]);
      setIsOptimizing(false);
      toast.success("Маршрут оптимизирован!");
    }, 500);
  };

  const handleSaveRoute = async () => {
    if (!user?.id) return;
    const taskIds = orderedTasks.map(t => t.id);
    await routeService.saveRoute(user.id, taskIds, stats.totalDistance, 0, true);
    toast.success("Маршрут сохранён как лучший!");
  };

  const handleLoadBestRoute = async () => {
    if (!user?.id) return;
    const best = await routeService.getBestRoute(user.id);
    if (!best) return toast.error("Нет сохранённых маршрутов");
    
    const newOrder: Task[] = [];
    best.route_order.forEach(id => {
      const task = tasks.find(t => t.id === id);
      if (task) newOrder.push(task);
    });
    
    tasks.forEach(task => {
      if (!best.route_order.includes(task.id)) newOrder.push(task);
    });

    setOrderedTasks(newOrder);
    toast.success("Лучший маршрут загружен!");
  };

  const handleNavigateToNext = () => {
    if (!nextTask || !nextTask.latitude || !nextTask.longitude) {
      return toast.error("Нет следующей точки доставки");
    }
    
    const yandexMapsUrl = `https://yandex.ru/maps/?rtext=${userLocation?.lat},${userLocation?.lng}~${nextTask.latitude},${nextTask.longitude}&rtt=auto`;
    window.open(yandexMapsUrl, '_blank');
    toast.success("Открываю навигацию в Яндекс.Картах");
  };

  return (
    <Layout title="Карта доставок">
      <div className="space-y-4 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🗺️ Карта доставок</h1>
            <p className="text-sm text-muted-foreground">Построение маршрута</p>
          </div>
        </div>

        {!userLocation && (
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
            <MapPin className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              ⚠️ Разрешите доступ к геолокации
            </AlertDescription>
          </Alert>
        )}

        {tasks.length === 0 && (
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              На сегодня нет заданий
            </AlertDescription>
          </Alert>
        )}

        {nextTask && (
          <Card className="border-2 border-green-500">
            <CardHeader className="pb-3 bg-green-50 dark:bg-green-950">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-300">
                <Navigation className="h-5 w-5" />
                🎯 Следующая доставка
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="font-bold">{nextTask.address}</p>
                  <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                    <span>⏰ {new Date(nextTask.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>📦 {nextTask.boxes_count} кор.</span>
                  </div>
                  {etas.get(nextTask.id) && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      🏁 Прибытие: {etas.get(nextTask.id)!.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
              
              <Button 
                onClick={handleNavigateToNext} 
                className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700" 
                disabled={!userLocation}
              >
                <Navigation className="mr-2 h-5 w-5" />
                🧭 Построить маршрут
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Дистанция</div>
            <p className="text-xl font-bold">{stats.totalDistance.toFixed(1)} км</p>
          </Card>
          
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Готово</div>
            <p className="text-xl font-bold">{stats.delivered} / {stats.total}</p>
          </Card>

          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">В пути</div>
            <p className="text-xl font-bold">{stats.inProgress}</p>
          </Card>

          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Ожидает</div>
            <p className="text-xl font-bold">{stats.pending}</p>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Управление</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button 
              onClick={handleOptimize} 
              disabled={isOptimizing || !userLocation}
              variant="default"
            >
              <Zap className="mr-2 h-4 w-4" />
              ⚡ Оптимизировать
            </Button>
            
            <Button 
              onClick={handleLoadBestRoute} 
              variant="outline"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              📈 Лучший
            </Button>

            <Button 
              onClick={handleSaveRoute}
              variant="outline"
            >
              <Save className="mr-2 h-4 w-4" />
              💾 Сохранить
            </Button>

            <Button 
              onClick={() => setShowTrace(!showTrace)}
              variant="outline"
            >
              {showTrace ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
              {showTrace ? "👁️ След" : "Скрыть"}
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="py-3">
            <CardTitle className="text-base">🗺️ Карта</CardTitle>
          </CardHeader>
          <div id="map-container" className="w-full h-[500px] bg-muted" />
        </Card>
      </div>
    </Layout>
  );
}