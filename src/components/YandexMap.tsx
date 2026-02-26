import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Task, CourierLocation } from "@/types";

interface YandexMapProps {
  tasks: Task[];
  courierLocation?: CourierLocation;
  className?: string;
  onMarkerClick?: (task: Task) => void;
}

export function YandexMap({ tasks, courierLocation, className, onMarkerClick }: YandexMapProps) {
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

  // Update markers when tasks change
  useEffect(() => {
    if (!mapInstance || !ymaps) return;

    mapInstance.geoObjects.removeAll();

    // Courier marker
    if (courierLocation) {
      const courierPlacemark = new ymaps.Placemark(
        [courierLocation.latitude, courierLocation.longitude],
        {
          hintContent: "Я здесь",
        },
        {
          preset: "islands#blueCircleDotIcon",
        }
      );
      mapInstance.geoObjects.add(courierPlacemark);
    }

    // Task markers
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
  }, [mapInstance, ymaps, tasks, courierLocation]);

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