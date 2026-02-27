import { supabase } from "@/lib/supabase";
import { Task } from "@/types";

export const taskService = {
  // Получить задачи курьера на сегодня
  async getTodayTasks(courierId: string): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("courier_id", courierId)
      .gte("scheduled_time", today.toISOString())
      .order("scheduled_time", { ascending: true });

    if (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }

    return (data as unknown as Task[]) || [];
  },

  // Получить следующие 3 задачи
  async getNextTasks(courierId: string, limit: number = 3): Promise<Task[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("courier_id", courierId)
      .in("status", ["pending", "in_progress"])
      .gte("scheduled_time", now)
      .order("scheduled_time", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching next tasks:", error);
      throw error;
    }

    return (data as unknown as Task[]) || [];
  },

  // Обновить статус задачи
  async updateTaskStatus(taskId: string, status: Task["status"]): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
  },

  // Получить задачи по временному слоту
  async getTasksByTimeSlot(courierId: string, timeSlot: Task["time_slot"]): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("courier_id", courierId)
      .eq("time_slot", timeSlot)
      .order("scheduled_time", { ascending: true });

    if (error) {
      console.error("Error fetching tasks by time slot:", error);
      throw error;
    }

    return (data as unknown as Task[]) || [];
  },

  // Подписаться на изменения задач (realtime)
  subscribeToTasks(courierId: string, onUpdate: () => void) {
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `courier_id=eq.${courierId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};