import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type DeliveryPoint = Database["public"]["Tables"]["delivery_points"]["Row"];
type User = Database["public"]["Tables"]["users"]["Row"];

interface CourierLocation {
  courier_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
  courier?: User;
}

interface CourierWithStats extends User {
  active_tasks: number;
  completed_today: number;
  current_location?: {
    latitude: number;
    longitude: number;
  };
  distance_to_point?: number;
}

// Calculate distance between two points (Haversine formula)
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

export const dispatcherService = {
  // Get all couriers with real-time locations
  async getAllCouriersWithLocations(): Promise<CourierWithStats[]> {
    const { data: couriers, error: couriersError } = await supabase
      .from("users")
      .select("*")
      .eq("role", "courier")
      .eq("status", "active");

    if (couriersError) throw couriersError;

    // Get active tasks count for each courier
    const { data: activeTasks } = await supabase
      .from("tasks")
      .select("courier_id")
      .in("status", ["pending", "in_progress"]);

    // Get completed tasks today
    const today = new Date().toISOString().split("T")[0];
    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("courier_id")
      .eq("status", "completed")
      .gte("completed_at", `${today}T00:00:00`);

    // Get current locations
    const { data: locations } = await supabase
      .from("locations")
      .select("*")
      .order("created_at", { ascending: false });

    const couriersWithStats: CourierWithStats[] = couriers.map((courier) => {
      const activeCount =
        activeTasks?.filter((t) => t.courier_id === courier.id).length || 0;
      const completedCount =
        completedTasks?.filter((t) => t.courier_id === courier.id).length || 0;
      const location = locations?.find((l) => l.user_id === courier.id);

      return {
        ...courier,
        active_tasks: activeCount,
        completed_today: completedCount,
        current_location: location
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
            }
          : undefined,
      };
    });

    return couriersWithStats;
  },

  // Find nearest available courier to a point
  async findNearestCourier(
    pointId: string
  ): Promise<CourierWithStats | null> {
    const { data: point, error: pointError } = await supabase
      .from("delivery_points")
      .select("*")
      .eq("id", pointId)
      .single();

    if (pointError || !point) throw pointError;

    const couriers = await this.getAllCouriersWithLocations();

    // Filter couriers with known locations and calculate distances
    const couriersWithDistance = couriers
      .filter((c) => c.current_location)
      .map((courier) => ({
        ...courier,
        distance_to_point: calculateDistance(
          courier.current_location!.latitude,
          courier.current_location!.longitude,
          point.latitude,
          point.longitude
        ),
      }))
      .sort((a, b) => {
        // Sort by: 1) Active tasks (fewer is better), 2) Distance (closer is better)
        if (a.active_tasks !== b.active_tasks) {
          return a.active_tasks - b.active_tasks;
        }
        return (a.distance_to_point || 0) - (b.distance_to_point || 0);
      });

    return couriersWithDistance[0] || null;
  },

  // Auto-assign task to nearest courier
  async autoAssignTask(taskId: string): Promise<boolean> {
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*, delivery_points(*)")
      .eq("id", taskId)
      .single();

    if (taskError || !task) throw taskError;

    const nearestCourier = await this.findNearestCourier(
      task.delivery_point_id
    );

    if (!nearestCourier) {
      throw new Error("No available couriers found");
    }

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ courier_id: nearestCourier.id })
      .eq("id", taskId);

    if (updateError) throw updateError;

    return true;
  },

  // Subscribe to real-time courier locations
  subscribeToCourierLocations(
    callback: (locations: CourierLocation[]) => void
  ) {
    const channel = supabase
      .channel("courier_locations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "locations",
        },
        async () => {
          const { data } = await supabase
            .from("locations")
            .select("*, users(*)")
            .order("created_at", { ascending: false });

          if (data) {
            const locations: CourierLocation[] = data.map((loc) => ({
              courier_id: loc.user_id,
              latitude: loc.latitude,
              longitude: loc.longitude,
              updated_at: loc.created_at,
              courier: loc.users as User,
            }));
            callback(locations);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Get analytics data
  async getAnalytics(period: "day" | "week" | "month") {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }

    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .gte("created_at", startDate.toISOString());

    const completed = tasks?.filter((t) => t.status === "completed").length || 0;
    const inProgress = tasks?.filter((t) => t.status === "in_progress").length || 0;
    const pending = tasks?.filter((t) => t.status === "pending").length || 0;

    return {
      total: tasks?.length || 0,
      completed,
      inProgress,
      pending,
      completionRate: tasks?.length ? (completed / tasks.length) * 100 : 0,
    };
  },

  // Get courier leaderboard
  async getCourierLeaderboard(period: "day" | "week" | "month") {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }

    const { data: tasks } = await supabase
      .from("tasks")
      .select("*, users(*)")
      .eq("status", "completed")
      .gte("completed_at", startDate.toISOString());

    const courierStats = tasks?.reduce(
      (acc, task) => {
        const courierId = task.courier_id;
        if (!courierId) return acc;

        if (!acc[courierId]) {
          acc[courierId] = {
            courier: task.users as User,
            completed: 0,
            boxes: 0,
          };
        }

        acc[courierId].completed += 1;
        acc[courierId].boxes += task.box_count || 0;

        return acc;
      },
      {} as Record<
        string,
        { courier: User; completed: number; boxes: number }
      >
    );

    return Object.values(courierStats || {}).sort(
      (a, b) => b.completed - a.completed
    );
  },
};