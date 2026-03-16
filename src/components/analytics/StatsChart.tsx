import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

interface Props {
  courierId?: string;
  title?: string;
  data?: any;
  valueSuffix?: string;
}

interface DayStats {
  date: string;
  deliveries: number;
}

export function StatsChart({ courierId, title, data: propData, valueSuffix = " шт" }: Props) {
  const [data, setData] = useState<DayStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propData) {
      setData(propData);
      setLoading(false);
    } else if (courierId) {
      fetchWeekStats();
    }
  }, [courierId, propData]);

  const fetchWeekStats = async () => {
    try {
      const days = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const { data: tasks } = await (supabase as any)
          .from("tasks")
          .select("id")
          .eq("courier_id", courierId)
          .eq("status", "delivered")
          .gte("completed_at", startOfDay.toISOString())
          .lt("completed_at", endOfDay.toISOString());

        days.push({
          date: date.toLocaleDateString("ru", { weekday: "short" }),
          deliveries: tasks?.length || 0,
        });
      }

      setData(days);
    } catch (error) {
      console.error("Error fetching week stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-48 flex items-center justify-center">Загрузка...</div>;
  }

  const maxDeliveries = Math.max(...data.map((d: any) => d.deliveries), 1);

  return (
    <div className="space-y-4">
      {title && <h3 className="text-sm font-medium">{title}</h3>}
      <div className="flex items-end justify-between gap-2 h-48">
        {data.map((day: any, index: number) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex items-end justify-center h-40">
              <div
                className="w-full bg-primary rounded-t-lg transition-all hover:bg-primary/80 cursor-pointer relative group"
                style={{
                  height: `${(day.deliveries / maxDeliveries) * 100}%`,
                  minHeight: day.deliveries > 0 ? "8px" : "0px",
                }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground px-2 py-1 rounded text-xs font-semibold whitespace-nowrap z-10">
                  {day.deliveries}{valueSuffix}
                </div>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {day.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}