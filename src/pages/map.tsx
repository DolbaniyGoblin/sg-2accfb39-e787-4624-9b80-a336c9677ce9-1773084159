import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, MapPin, Phone, Package, Clock } from "lucide-react";
import { taskService } from "@/services/taskService";
import { locationService } from "@/services/locationService";
import type { Task } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

declare global {
  interface Window {
    ymaps: any;
  }
}

export default function MapPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [map, setMap] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Получаем задания
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = taskService.subscribeToTasks(user.id, (updatedTasks) => {
      setTasks(updatedTasks.filter(t => t.status !== "completed"));
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Отслеживаем геолокацию курьера
  useEffect(() => {
    if (!user?.id) return;

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });

          // Обновляем местоположение в базе каждые 30 секунд
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
      : [55.751244, 37.618423]; // Москва по умолчанию

    const ymap = new window.ymaps.Map("map-container", {
      center: initialCenter,
      zoom: 12,
      controls: ["zoomControl", "typeSelector", "fullscreenControl"]
    });

    setMap(ymap);
  }, [isMapLoaded, map, userLocation]);

  // Добавляем метки на карту
  useEffect(() => {
    if (!map || !tasks.length) return;

    // Очищаем старые метки
    map.geoObjects.removeAll();

    // Добавляем метку текущего местоположения
    if (userLocation) {
      const userPlacemark = new window.ymaps.Placemark(
        [userLocation.lat, userLocation.lng],
        {
          balloonContent: "<strong>Вы здесь</strong>",
          iconCaption: "Моё местоположение"
        },
        {
          preset: "islands#blueCircleDotIcon",
          iconColor: "#3b82f6"
        }
      );
      map.geoObjects.add(userPlacemark);
    }

    // Добавляем метки доставок
    tasks.forEach((task, index) => {
      if (!task.location?.lat || !task.location?.lng) return;

      const placemark = new window.ymaps.Placemark(
        [task.location.lat, task.location.lng],
        {
          balloonContent: `
            <div style="padding: 10px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${task.address}</h3>
              <p style="margin: 4px 0; font-size: 12px;">📦 ${task.boxes} коробок</p>
              <p style="margin: 4px 0; font-size: 12px;">⏰ ${task.time}</p>
              <p style="margin: 4px 0; font-size: 12px;">👤 ${task.client}</p>
              <p style="margin: 4px 0; font-size: 12px;">📞 ${task.phone}</p>
            </div>
          `,
          iconCaption: `${index + 1}. ${task.boxes} коробок`
        },
        {
          preset: task.status === "in_progress" ? "islands#orangeCircleIcon" : "islands#redCircleIcon",
          iconColor: task.status === "in_progress" ? "#f97316" : "#ef4444"
        }
      );

      placemark.events.add("click", () => {
        setSelectedTask(task);
      });

      map.geoObjects.add(placemark);
    });
  }, [map, tasks, userLocation]);

  const buildRoute = async (task: Task) => {
    if (!map || !userLocation || !task.location?.lat || !task.location?.lng) return;

    // Очищаем предыдущие маршруты
    map.geoObjects.removeAll();

    // Восстанавливаем метки
    const userPlacemark = new window.ymaps.Placemark(
      [userLocation.lat, userLocation.lng],
      { iconCaption: "Вы" },
      { preset: "islands#blueCircleDotIcon" }
    );
    map.geoObjects.add(userPlacemark);

    const taskPlacemark = new window.ymaps.Placemark(
      [task.location.lat, task.location.lng],
      { iconCaption: task.address },
      { preset: "islands#redCircleIcon" }
    );
    map.geoObjects.add(taskPlacemark);

    // Строим маршрут
    const multiRoute = new window.ymaps.multiRouter.MultiRoute(
      {
        referencePoints: [
          [userLocation.lat, userLocation.lng],
          [task.location.lat, task.location.lng]
        ],
        params: { routingMode: "auto" }
      },
      {
        boundsAutoApply: true,
        wayPointStartIconColor: "#3b82f6",
        wayPointFinishIconColor: "#ef4444",
        routeActiveStrokeColor: "#3b82f6",
        routeActiveStrokeWidth: 4
      }
    );

    map.geoObjects.add(multiRoute);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Карта доставок</h1>
          <p className="text-muted-foreground">Все точки маршрута на карте</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Карта */}
          <Card className="lg:col-span-2">
            <CardContent className="p-0">
              <div id="map-container" className="w-full h-[600px] rounded-lg" />
            </CardContent>
          </Card>

          {/* Информация о выбранной доставке */}
          <Card>
            <CardHeader>
              <CardTitle>Информация</CardTitle>
              <CardDescription>
                {selectedTask ? "Детали выбранной доставки" : "Выберите точку на карте"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTask ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedTask.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedTask.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedTask.boxes} коробок</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-medium">Клиент</p>
                    <p className="text-sm text-muted-foreground">{selectedTask.client}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedTask.phone}`} className="text-primary hover:underline">
                        {selectedTask.phone}
                      </a>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Badge variant={
                      selectedTask.status === "pending" ? "secondary" :
                      selectedTask.status === "in_progress" ? "default" :
                      "outline"
                    }>
                      {selectedTask.status === "pending" ? "Ожидает" :
                       selectedTask.status === "in_progress" ? "В пути" :
                       "На месте"}
                    </Badge>
                  </div>

                  <Button 
                    onClick={() => buildRoute(selectedTask)}
                    className="w-full"
                    disabled={!userLocation}
                  >
                    <Navigation className="mr-2 h-4 w-4" />
                    Построить маршрут
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Нажмите на метку на карте, чтобы увидеть информацию о доставке</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Список активных доставок */}
        <Card>
          <CardHeader>
            <CardTitle>Активные доставки</CardTitle>
            <CardDescription>Всего точек: {tasks.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task);
                    if (task.location?.lat && task.location?.lng && map) {
                      map.setCenter([task.location.lat, task.location.lng], 15, {
                        duration: 300
                      });
                    }
                  }}
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{task.address}</p>
                      <p className="text-sm text-muted-foreground">{task.time} • {task.boxes} коробок</p>
                    </div>
                  </div>
                  <Badge variant={
                    task.status === "pending" ? "secondary" :
                    task.status === "in_progress" ? "default" :
                    "outline"
                  }>
                    {task.status === "pending" ? "Ожидает" :
                     task.status === "in_progress" ? "В пути" :
                     "На месте"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}