import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Task, CourierLocation } from "@/types";

interface DeliveryPoint {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  status?: string;
  boxes_count?: number;
}

interface YandexMapProps {
  tasks?: Task[];
  deliveryPoints?: DeliveryPoint[];
  courierLocation?: CourierLocation;
  currentLocation?: { latitude: number; longitude: number };
  className?: string;
  showRoute?: boolean;
  onMarkerClick?: (point: any) => void;
}

export function YandexMap({ 
  tasks = [], 
  deliveryPoints = [], 
  courierLocation, 
  currentLocation,
  className, 
  showRoute = true,
  onMarkerClick 
}: YandexMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [ymaps, setYmaps] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load Yandex Maps script dynamically
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY || ""}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      setYmaps((window as any).ymaps);
      setIsLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!ymaps || !mapRef.current || mapInstance) return;

    ymaps.ready(() => {
      const map = new ymaps.Map(mapRef.current, {
        center: [55.751244, 37.618423], // Moscow default
        zoom: 11,
        controls: ["zoomControl", "fullscreenControl"],
      });

      setMapInstance(map);
    });
  }, [ymaps, mapRef]);

  // Update markers when tasks/points change
  useEffect(() => {
    if (!mapInstance || !ymaps) return;

    mapInstance.geoObjects.removeAll();

    // Courier marker (legacy prop)
    if (courierLocation) {
      const courierPlacemark = new ymaps.Placemark(
        [courierLocation.latitude, courierLocation.longitude],
        {
          hintContent: "Курьер",
        },
        {
          preset: "islands#blueCircleDotIcon",
        }
      );
      mapInstance.geoObjects.add(courierPlacemark);
    }

    // Current location marker (generic prop)
    if (currentLocation) {
      const currentPlacemark = new ymaps.Placemark(
        [currentLocation.latitude, currentLocation.longitude],
        {
          hintContent: "Текущая позиция",
        },
        {
          preset: "islands#blueCircleDotIcon",
        }
      );
      mapInstance.geoObjects.add(currentPlacemark);
    }

    // Task markers (Courier view)
    if (tasks.length > 0) {
      tasks.forEach((task) => {
        const placemark = new ymaps.Placemark(
          [task.latitude, task.longitude],
          {
            balloonContentHeader: task.client_name,
            balloonContentBody: `${task.address}<br/>Коробок: ${task.boxes_count}`,
            balloonContentFooter: task.time_slot,
          },
          {
            preset: task.status === "delivered" ? "islands#greenIcon" : "islands#redIcon",
          }
        );

        placemark.events.add("click", () => {
          if (onMarkerClick) onMarkerClick(task);
        });

        mapInstance.geoObjects.add(placemark);
      });

      // Build route if enabled
      if (showRoute && tasks.length > 0) {
        const points = tasks.map(t => [t.latitude, t.longitude]);
        if (courierLocation) {
          points.unshift([courierLocation.latitude, courierLocation.longitude]);
        }

        const multiRoute = new ymaps.multiRouter.MultiRoute({
          referencePoints: points,
          params: {
            routingMode: 'auto'
          }
        }, {
          boundsAutoApply: true
        });

        mapInstance.geoObjects.add(multiRoute);
      }
    }

    // Delivery points / Couriers markers (Dispatcher view)
    if (deliveryPoints.length > 0) {
      deliveryPoints.forEach((point) => {
        let preset = "islands#blueIcon";
        if (point.status === "in_progress") preset = "islands#redIcon"; // Busy
        if (point.status === "completed") preset = "islands#greenIcon"; // Free/Done
        if (point.status === "pending") preset = "islands#grayIcon"; // Offline/Unknown

        const placemark = new ymaps.Placemark(
          [point.latitude, point.longitude],
          {
            balloonContentHeader: point.address, // Courier name or Address
            balloonContentBody: `Статус: ${point.status}<br/>Коробок: ${point.boxes_count || 0}`,
          },
          {
            preset: preset,
          }
        );

        placemark.events.add("click", () => {
          if (onMarkerClick) onMarkerClick(point);
        });

        mapInstance.geoObjects.add(placemark);
      });
      
      // Auto-fit bounds
      if (deliveryPoints.length > 0) {
         mapInstance.setBounds(mapInstance.geoObjects.getBounds(), {
            checkZoomRange: true,
            zoomMargin: 50
        });
      }
    }

  }, [mapInstance, ymaps, tasks, deliveryPoints, courierLocation, currentLocation, showRoute]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full min-h-[300px] rounded-lg overflow-hidden" />
    </div>
  );
}