import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { dispatcherService } from "@/services/dispatcherService";
import { YandexMap } from "@/components/YandexMap";
import {
  MapPin,
  Users,
  TrendingUp,
  Clock,
  Package,
  Navigation,
  Zap,
} from "lucide-react";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

export default function LiveMap() {
  const { toast } = useToast();
  const [couriers, setCouriers] = useState<any[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "busy" | "free">("all");

  useEffect(() => {
    loadCouriers();

    // Subscribe to real-time updates
    const unsubscribe = dispatcherService.subscribeToCourierLocations(
      (locations) => {
        loadCouriers();
      }
    );

    const interval = setInterval(loadCouriers, 30000); // Refresh every 30s

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadCouriers = async () => {
    try {
      const data = await dispatcherService.getAllCouriersWithLocations();
      setCouriers(data);
    } catch (error) {
      console.error("Error loading couriers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCourierStatusColor = (courier: any) => {
    if (courier.active_tasks > 0) return "destructive";
    if (courier.completed_today > 0) return "default";
    return "secondary";
  };

  const getCourierStatusText = (courier: any) => {
    if (courier.active_tasks > 0) return "В пути";
    if (courier.completed_today > 0) return "Свободен";
    return "Неактивен";
  };

  const filteredCouriers = useMemo(() => {
    if (statusFilter === "all") return couriers;
    if (statusFilter === "active") return couriers.filter(c => c.status === "active");
    if (statusFilter === "busy") return couriers.filter(c => c.active_tasks > 0);
    if (statusFilter === "free") return couriers.filter(c => c.active_tasks === 0 && c.status === "active");
    return couriers;
  }, [couriers, statusFilter]);

  const deliveryPoints = filteredCouriers
    .filter((c) => c.current_location)
    .map((courier) => ({
      id: courier.id,
      address: courier.full_name || "Курьер",
      latitude: courier.current_location!.latitude,
      longitude: courier.current_location!.longitude,
      status:
        courier.active_tasks > 0
          ? "in_progress"
          : courier.completed_today > 0
            ? "completed"
            : "pending",
      boxes_count: courier.active_tasks,
    }));

  return (
    <Layout title="🗺️ Живая карта курьеров">
      {!loading && (
        <div className="space-y-6">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              Все ({couriers.length})
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              Активные ({couriers.filter(c => c.status === "active").length})
            </Button>
            <Button
              variant={statusFilter === "busy" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("busy")}
            >
              В пути ({couriers.filter(c => c.active_tasks > 0).length})
            </Button>
            <Button
              variant={statusFilter === "free" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("free")}
            >
              Свободны ({couriers.filter(c => c.active_tasks === 0 && c.status === "active").length})
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Всего курьеров
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{couriers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Активных: {couriers.filter((c) => c.status === "active").length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">В пути</CardTitle>
                <Navigation className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {couriers.filter((c) => c.active_tasks > 0).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Активных заданий:{" "}
                  {couriers.reduce((sum, c) => sum + c.active_tasks, 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Доставлено сегодня
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {couriers.reduce((sum, c) => sum + c.completed_today, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Средняя скорость: ~45 мин
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Свободных</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    couriers.filter(
                      (c) => c.active_tasks === 0 && c.status === "active"
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Готовы к назначению
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Couriers List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Курьеры онлайн
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="text-center text-muted-foreground">
                    Загрузка...
                  </div>
                ) : filteredCouriers.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    Нет курьеров по выбранному фильтру
                  </div>
                ) : (
                  filteredCouriers.map((courier) => (
                    <div
                      key={courier.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                        selectedCourier?.id === courier.id
                          ? "bg-accent border-primary"
                          : ""
                      }`}
                      onClick={() => setSelectedCourier(courier)}
                    >
                      <Avatar>
                        <AvatarImage src={courier.photo_url || undefined} />
                        <AvatarFallback>
                          {courier.full_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {courier.full_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {courier.completed_today} доставок сегодня
                        </div>
                      </div>
                      <Badge variant={getCourierStatusColor(courier)}>
                        {getCourierStatusText(courier)}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Map */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Карта в реальном времени
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                ) : deliveryPoints.length > 0 ? (
                  <YandexMap
                    deliveryPoints={deliveryPoints}
                    currentLocation={
                      selectedCourier?.current_location || undefined
                    }
                    showRoute={false}
                    onMarkerClick={(point) => {
                      const courier = couriers.find((c) => c.id === point.id);
                      if (courier) setSelectedCourier(courier);
                    }}
                  />
                ) : (
                  <div className="h-[500px] bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Нет активных курьеров на карте</p>
                    </div>
                  </div>
                )}

                {selectedCourier && (
                  <div className="mt-4 p-4 bg-accent rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={selectedCourier.photo_url || undefined}
                          />
                          <AvatarFallback>
                            {selectedCourier.full_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {selectedCourier.full_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {selectedCourier.email}
                          </div>
                        </div>
                      </div>
                      <Badge variant={getCourierStatusColor(selectedCourier)}>
                        {getCourierStatusText(selectedCourier)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">
                          {selectedCourier.active_tasks}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Активных
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {selectedCourier.completed_today}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Сегодня
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {selectedCourier.rating?.toFixed(1) || "5.0"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Рейтинг
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </Layout>
  );
}