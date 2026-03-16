import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";

interface CourierStats {
  id: string;
  full_name: string;
  avatar_url: string | null;
  deliveries: number;
  rating: number;
  rank: number;
}

interface Props {
  currentUserId?: string;
  couriers?: any[];
  period?: string;
}

export function CourierLeaderboard({ currentUserId, couriers, period }: Props) {
  const [leaderboard, setLeaderboard] = useState<CourierStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (couriers) {
      setLeaderboard(couriers);
      setLoading(false);
    } else {
      fetchLeaderboard();
    }
  }, [couriers]);

  const fetchLeaderboard = async () => {
    try {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);

      const { data: tasks } = await (supabase as any)
        .from("tasks")
        .select("courier_id")
        .eq("status", "delivered")
        .gte("completed_at", monthAgo.toISOString());

      const courierCounts = tasks?.reduce((acc: Record<string, number>, task: any) => {
        acc[task.courier_id] = (acc[task.courier_id] || 0) + 1;
        return acc;
      }, {}) || {};

      const courierIds = Object.keys(courierCounts);
      
      if (courierIds.length === 0) {
        setLeaderboard([]);
        return;
      }

      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, avatar_url, rating")
        .in("id", courierIds);

      const leaderboardData: CourierStats[] = (profiles || [])
        .map((profile: any) => ({
          id: profile.id,
          full_name: profile.full_name || "Курьер",
          avatar_url: profile.avatar_url,
          deliveries: courierCounts[profile.id] || 0,
          rating: profile.rating || 5.0,
          rank: 0,
        }))
        .sort((a: any, b: any) => b.deliveries - a.deliveries)
        .map((item: any, index: number) => ({ ...item, rank: index + 1 }))
        .slice(0, 10);

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-500";
      case 2:
        return "text-gray-400";
      case 3:
        return "text-amber-700";
      default:
        return "text-muted-foreground";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-3">
      {leaderboard.map((courier) => {
        const isCurrentUser = courier.id === currentUserId;
        
        return (
          <div
            key={courier.id}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
              isCurrentUser
                ? "bg-primary/5 border-primary border-2"
                : "bg-card border-border hover:border-primary/50"
            }`}
          >
            <div className={`text-2xl font-bold ${getMedalColor(courier.rank)}`}>
              {courier.rank <= 3 ? <Trophy className="w-6 h-6" /> : `#${courier.rank}`}
            </div>

            <Avatar className="h-12 w-12">
              <AvatarImage src={courier.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10">
                {courier.full_name?.charAt(0)?.toUpperCase() || "K"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold truncate">
                  {courier.full_name}
                  {isCurrentUser && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Вы
                    </Badge>
                  )}
                </h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Рейтинг: {courier.rating?.toFixed(1) || "5.0"} ⭐
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{courier.deliveries}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                доставок
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}