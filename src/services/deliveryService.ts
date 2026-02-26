import { supabase } from "@/lib/supabase";
import { Delivery } from "@/types";

export const deliveryService = {
  // Создать запись о доставке
  async createDelivery(
    taskId: string,
    courierId: string,
    photoFile?: File,
    notes?: string
  ): Promise<Delivery> {
    let photoUrl: string | null = null;

    // Загрузить фото в Storage если есть
    if (photoFile) {
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `${taskId}_${Date.now()}.${fileExt}`;
      const filePath = `${courierId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("delivery-photos")
        .upload(filePath, photoFile);

      if (uploadError) {
        console.error("Error uploading photo:", uploadError);
        throw uploadError;
      }

      // Получить публичный URL
      const { data: urlData } = supabase.storage
        .from("delivery-photos")
        .getPublicUrl(filePath);

      photoUrl = urlData.publicUrl;
    }

    // Создать запись о доставке
    const { data, error } = await supabase
      .from("deliveries")
      .insert({
        task_id: taskId,
        courier_id: courierId,
        photo_url: photoUrl,
        notes: notes || null,
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating delivery:", error);
      throw error;
    }

    // Обновить статус задачи на "delivered"
    await supabase
      .from("tasks")
      .update({ status: "delivered" })
      .eq("id", taskId);

    return data;
  },

  // Получить историю доставок курьера
  async getDeliveryHistory(courierId: string): Promise<Delivery[]> {
    const { data, error } = await supabase
      .from("deliveries")
      .select(`
        *,
        tasks (
          client_name,
          address,
          boxes_count,
          scheduled_time
        )
      `)
      .eq("courier_id", courierId)
      .order("delivered_at", { ascending: false });

    if (error) {
      console.error("Error fetching delivery history:", error);
      throw error;
    }

    return data || [];
  },

  // Получить доставки за сегодня
  async getTodayDeliveries(courierId: string): Promise<Delivery[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("deliveries")
      .select(`
        *,
        tasks (
          client_name,
          address,
          boxes_count
        )
      `)
      .eq("courier_id", courierId)
      .gte("delivered_at", today.toISOString())
      .order("delivered_at", { ascending: false });

    if (error) {
      console.error("Error fetching today's deliveries:", error);
      throw error;
    }

    return data || [];
  },

  // Получить статистику за сегодня
  async getTodayStats(courierId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: deliveries, error: deliveriesError } = await supabase
      .from("deliveries")
      .select("*")
      .eq("courier_id", courierId)
      .gte("delivered_at", today.toISOString());

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("courier_id", courierId)
      .gte("scheduled_time", today.toISOString());

    if (deliveriesError || tasksError) {
      console.error("Error fetching stats:", { deliveriesError, tasksError });
      throw deliveriesError || tasksError;
    }

    return {
      deliveredToday: deliveries?.length || 0,
      totalTasksToday: tasks?.length || 0,
      earnedToday: (deliveries?.length || 0) * 200, // Примерная оплата за доставку
      kmToday: 0, // TODO: Рассчитать на основе геолокации
    };
  },
};