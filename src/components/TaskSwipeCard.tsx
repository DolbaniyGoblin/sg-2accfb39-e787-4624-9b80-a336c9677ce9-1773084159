import { motion, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Package, Clock, Phone, Navigation } from "lucide-react";
import { Task } from "@/types";
import { formatTime } from "@/lib/utils";
import { useState } from "react";

interface TaskSwipeCardProps {
  task: Task;
  onSwipeRight: (task: Task) => void; // Start/Complete
  onSwipeLeft: (task: Task) => void;  // Problem/Skip
}

export function TaskSwipeCard({ task, onSwipeRight, onSwipeLeft }: TaskSwipeCardProps) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5]);
  const rotate = useTransform(x, [-100, 0, 100], [-10, 0, 10]);
  const bg = useTransform(x, [-100, 0, 100], ["#fee2e2", "#ffffff", "#dcfce7"]); // Red -> White -> Green

  const [exitX, setExitX] = useState<number | null>(null);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      setExitX(200);
      onSwipeRight(task);
    } else if (info.offset.x < -100) {
      setExitX(-200);
      onSwipeLeft(task);
    }
  };

  if (exitX !== null) {
    return null; // Component removes itself via parent state usually, but this hides it visually immediately
  }

  const isPending = task.status === "pending";
  const isInProgress = task.status === "in_progress";

  const rightLabel = isPending ? "Взять" : "Готово";
  const leftLabel = isPending ? "Пропуск" : "Проблема";

  return (
    <motion.div
      style={{ x, opacity, rotate, background: bg }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="relative touch-none rounded-xl overflow-hidden shadow-lg mb-4 border border-border"
      whileTap={{ cursor: "grabbing" }}
    >
      {/* Swipe Indicators */}
      <motion.div 
        style={{ opacity: useTransform(x, [0, 50], [0, 1]) }}
        className="absolute left-4 top-4 z-10 text-green-600 font-bold text-2xl border-2 border-green-600 rounded-lg px-2 rotate-[-15deg]"
      >
        {rightLabel.toUpperCase()}
      </motion.div>

      <motion.div 
        style={{ opacity: useTransform(x, [0, -50], [0, 1]) }}
        className="absolute right-4 top-4 z-10 text-red-500 font-bold text-2xl border-2 border-red-500 rounded-lg px-2 rotate-[15deg]"
      >
        {leftLabel.toUpperCase()}
      </motion.div>

      <CardContent className="p-5 select-none bg-card">
        <div className="flex justify-between items-start mb-3">
          <Badge variant={isInProgress ? "default" : "secondary"} className="text-xs">
            {isInProgress ? "В работе" : "Ожидает"}
          </Badge>
          <span className="font-mono text-sm font-bold text-muted-foreground">
            {formatTime(task.scheduled_time)}
          </span>
        </div>

        <h3 className="font-bold text-lg mb-1 leading-tight">{task.client_name || "Клиент"}</h3>
        
        <div className="flex items-start gap-2 text-muted-foreground text-sm mb-4">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
          <span className="line-clamp-2">{task.address}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/50 p-2 rounded-lg flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-500" />
            <span className="font-semibold">{task.boxes_count} кор.</span>
          </div>
          <div className="bg-muted/50 p-2 rounded-lg flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="font-semibold">~15 мин</span>
          </div>
        </div>

        {isInProgress && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={(e) => e.stopPropagation()}>
              <Phone className="w-4 h-4 mr-2" />
              Звонок
            </Button>
            <Button size="sm" className="flex-1" onClick={(e) => {
              e.stopPropagation();
              if (task.latitude && task.longitude) {
                window.open(`yandexmaps://maps.yandex.ru/?pt=${task.longitude},${task.latitude}&z=12&l=map`, "_blank");
              }
            }}>
              <Navigation className="w-4 h-4 mr-2" />
              Карта
            </Button>
          </div>
        )}
        
        <div className="text-center mt-3 text-xs text-muted-foreground/50 font-medium">
          ← Свайп влево | Свайп вправо →
        </div>
      </CardContent>
    </motion.div>
  );
}