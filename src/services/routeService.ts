// Route optimization and ETA calculation service
import type { Task } from "@/types";
import { supabase } from "@/integrations/supabase/client";

interface Point {
  latitude: number;
  longitude: number;
  id?: string;
  address?: string;
}

// Calculate distance between two points using Haversine formula (in km)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Nearest Neighbor algorithm for route optimization
function nearestNeighbor(points: Point[], start: Point): Point[] {
  const unvisited = [...points];
  const route: Point[] = [];
  let current = start;

  while (unvisited.length > 0) {
    let nearest = unvisited[0];
    let minDistance = calculateDistance(
      current.latitude,
      current.longitude,
      nearest.latitude,
      nearest.longitude
    );

    for (let i = 1; i < unvisited.length; i++) {
      const distance = calculateDistance(
        current.latitude,
        current.longitude,
        unvisited[i].latitude,
        unvisited[i].longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = unvisited[i];
      }
    }

    route.push(nearest);
    unvisited.splice(unvisited.indexOf(nearest), 1);
    current = nearest;
  }

  return route;
}

export const routeService = {
  // Optimize route using nearest neighbor algorithm
  optimizeRoute(tasks: Task[], currentLocation?: Point): Task[] {
    if (tasks.length === 0) return [];
    if (tasks.length === 1) return tasks;

    const start = currentLocation || {
      latitude: tasks[0].latitude,
      longitude: tasks[0].longitude,
    };

    const points = tasks.map((task) => ({
      latitude: task.latitude,
      longitude: task.longitude,
      id: task.id,
      address: task.address,
    }));

    const optimized = nearestNeighbor(points, start);

    // Map back to original tasks maintaining order
    return optimized.map(
      (point) => tasks.find((t) => t.id === point.id)!
    );
  },

  // Calculate total route distance
  calculateTotalDistance(tasks: Task[], currentLocation?: Point): number {
    if (tasks.length === 0) return 0;

    let total = 0;
    let prev = currentLocation || {
      latitude: tasks[0].latitude,
      longitude: tasks[0].longitude,
    };

    for (const task of tasks) {
      total += calculateDistance(
        prev.latitude,
        prev.longitude,
        task.latitude,
        task.longitude
      );
      prev = { latitude: task.latitude, longitude: task.longitude };
    }

    return total;
  },

  // Calculate ETA (minutes) based on distance and average speed
  calculateETA(distanceKm: number, averageSpeedKmh: number = 30): number {
    // Default speed: 30 km/h (city driving with stops)
    const hours = distanceKm / averageSpeedKmh;
    return Math.ceil(hours * 60); // Convert to minutes
  },

  // Get distance to specific point
  getDistanceToPoint(
    from: Point,
    to: Point
  ): number {
    return calculateDistance(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude
    );
  },

  // Format distance for display
  formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)} м`;
    }
    return `${km.toFixed(1)} км`;
  },

  // Format ETA for display
  formatETA(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} мин`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
  },

  // Calculate ETAs for all tasks
  calculateETAs(tasks: Task[], startLat: number, startLng: number): Map<string, Date> {
    const etas = new Map<string, Date>();
    const now = new Date();
    let currentLat = startLat;
    let currentLng = startLng;
    let accumulatedMinutes = 0;

    tasks.forEach(task => {
      if (task.latitude && task.longitude) {
        const distance = calculateDistance(currentLat, currentLng, task.latitude, task.longitude);
        const minutes = this.calculateETA(distance); // 30 km/h avg
        accumulatedMinutes += minutes + 15; // +15 min for delivery
        
        const eta = new Date(now.getTime() + accumulatedMinutes * 60000);
        etas.set(task.id, eta);

        currentLat = task.latitude;
        currentLng = task.longitude;
      }
    });

    return etas;
  },

  // Get location history for today (for trace)
  async getTodayLocationHistory(courierId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('location_history')
      .select('*')
      .eq('courier_id', courierId)
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: true });
    
    return data || [];
  },

  // Add point to location history
  async addLocationToHistory(courierId: string, latitude: number, longitude: number, speed: number) {
    await supabase.from('location_history').insert({
      courier_id: courierId,
      latitude,
      longitude,
      speed
    });
  },

  // Save route
  async saveRoute(courierId: string, taskIds: string[], distance: number, duration: number, isBest: boolean) {
    if (isBest) {
      // Reset previous best route
      await supabase
        .from('saved_routes')
        .update({ is_best: false })
        .eq('courier_id', courierId);
    }

    await supabase.from('saved_routes').insert({
      courier_id: courierId,
      route_order: taskIds,
      total_distance: distance,
      estimated_duration: duration,
      is_best: isBest
    });
  },

  // Get best route
  async getBestRoute(courierId: string) {
    const { data } = await supabase
      .from('saved_routes')
      .select('*')
      .eq('courier_id', courierId)
      .eq('is_best', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data;
  }
};