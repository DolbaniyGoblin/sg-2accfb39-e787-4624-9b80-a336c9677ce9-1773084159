import { supabase } from "@/integrations/supabase/client";
import type { Task } from "@/types";

export interface RouteHistory {
  id: string;
  courier_id: string;
  route_order: string[]; // Массив task_id в порядке маршрута
  total_distance: number;
  estimated_time: number;
  created_at: string;
  is_best: boolean;
}

export interface LocationHistory {
  id: string;
  courier_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
}

export const routeService = {
  // Сохранить вариант маршрута
  async saveRoute(
    courierId: string,
    taskIds: string[],
    totalDistance: number,
    estimatedTime: number,
    isBest: boolean = false
  ): Promise<RouteHistory | null> {
    try {
      // Если это лучший вариант, сбросить флаг у остальных
      if (isBest) {
        await supabase
          .from("route_history")
          .update({ is_best: false })
          .eq("courier_id", courierId);
      }

      const { data, error } = await supabase
        .from("route_history")
        .insert({
          courier_id: courierId,
          route_order: taskIds,
          total_distance: totalDistance,
          estimated_time: estimatedTime,
          is_best: isBest,
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        route_order: data.route_order as unknown as string[]
      };
    } catch (error) {
      console.error("Failed to save route:", error);
      return null;
    }
  },

  // Получить лучший сохранённый маршрут
  async getBestRoute(courierId: string): Promise<RouteHistory | null> {
    try {
      const { data, error } = await supabase
        .from("route_history")
        .select("*")
        .eq("courier_id", courierId)
        .eq("is_best", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      return {
        ...data,
        route_order: data.route_order as unknown as string[]
      };
    } catch (error) {
      console.error("Failed to get best route:", error);
      return null;
    }
  },

  // Получить историю маршрутов
  async getRouteHistory(courierId: string, limit: number = 10): Promise<RouteHistory[]> {
    try {
      const { data, error } = await supabase
        .from("route_history")
        .select("*")
        .eq("courier_id", courierId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        route_order: item.route_order as unknown as string[]
      }));
    } catch (error) {
      console.error("Failed to get route history:", error);
      return [];
    }
  },

  // Добавить точку в историю перемещений
  async addLocationToHistory(
    courierId: string,
    latitude: number,
    longitude: number,
    speed?: number
  ): Promise<LocationHistory | null> {
    try {
      const { data, error } = await supabase
        .from("location_history")
        .insert({
          courier_id: courierId,
          latitude,
          longitude,
          speed,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to add location to history:", error);
      return null;
    }
  },

  // Получить историю перемещений за сегодня
  async getTodayLocationHistory(courierId: string): Promise<LocationHistory[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("location_history")
        .select("*")
        .eq("courier_id", courierId)
        .gte("timestamp", today.toISOString())
        .order("timestamp", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to get location history:", error);
      return [];
    }
  },

  // Очистить старую историю перемещений (старше 7 дней)
  async cleanOldLocationHistory(courierId: string): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      await supabase
        .from("location_history")
        .delete()
        .eq("courier_id", courierId)
        .lt("timestamp", sevenDaysAgo.toISOString());
    } catch (error) {
      console.error("Failed to clean old location history:", error);
    }
  },

  // Рассчитать ETA для каждой точки маршрута
  calculateETAs(
    tasks: Task[],
    startLat: number,
    startLng: number,
    averageSpeed: number = 30 // км/ч по умолчанию
  ): Map<string, Date> {
    const etas = new Map<string, Date>();
    let currentTime = new Date();
    let currentLat = startLat;
    let currentLng = startLng;

    tasks.forEach((task) => {
      if (!task.latitude || !task.longitude) return;

      // Расчёт расстояния до следующей точки
      const distance = this.calculateDistance(
        currentLat,
        currentLng,
        task.latitude,
        task.longitude
      );

      // Расчёт времени в пути (часы)
      const travelTimeHours = distance / averageSpeed;
      
      // Добавляем время на доставку (10 минут на каждую точку)
      const totalMinutes = travelTimeHours * 60 + 10;

      currentTime = new Date(currentTime.getTime() + totalMinutes * 60000);
      etas.set(task.id, new Date(currentTime));

      currentLat = task.latitude;
      currentLng = task.longitude;
    });

    return etas;
  },

  // Вспомогательная функция расчёта расстояния (Haversine)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Радиус Земли в км
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
};