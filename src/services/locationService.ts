import { supabase } from "@/lib/supabase";
import { CourierLocation } from "@/types";

export const locationService = {
  // Обновить текущую геолокацию курьера
  async updateLocation(
    courierId: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    const { error } = await supabase.from("locations").upsert(
      {
        courier_id: courierId,
        latitude,
        longitude,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "courier_id",
      }
    );

    if (error) {
      console.error("Error updating location:", error);
      throw error;
    }
  },

  // Получить текущую геолокацию курьера
  async getCurrentLocation(courierId: string): Promise<CourierLocation | null> {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("courier_id", courierId)
      .single();

    if (error) {
      console.error("Error fetching location:", error);
      return null;
    }

    return data;
  },

  // Начать отслеживание геолокации (каждые 30 секунд)
  startTracking(courierId: string): number {
    // Проверяем, поддерживает ли браузер Geolocation API
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return 0;
    }

    // Функция для получения и отправки координат
    const updatePosition = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.updateLocation(courierId, latitude, longitude).catch((error) => {
            console.error("Failed to update location:", error);
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    };

    // Первое обновление сразу
    updatePosition();

    // Затем каждые 30 секунд
    const intervalId = window.setInterval(updatePosition, 30000);

    return intervalId;
  },

  // Остановить отслеживание геолокации
  stopTracking(intervalId: number): void {
    if (intervalId) {
      clearInterval(intervalId);
    }
  },
};