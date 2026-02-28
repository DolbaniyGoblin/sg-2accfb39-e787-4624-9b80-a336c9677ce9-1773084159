import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Zap } from "lucide-react";

interface CourierStats {
  id: string;
  name: string;
  photo_url?: string;
  completed: number;
  rating: number;
  totalKm: number;
}

interface CourierLeaderboardProps {
  couriers: CourierStats[];
  title?: string;
}

export function CourierLeaderboard({ couriers, title = "🏆 Топ курьеров" }: CourierLeaderboardProps) {
  const top3 = couriers.slice(0, 3);
  const others = couriers.slice(3, 10);

  const getMedalIcon = (position: number) => {
    if (position === 0) return "🥇";
    if (position === 1) return "🥈";
    if (position === 2) return "🥉";
    return `#${position + 1}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Top 3 - Special Display */}
        {top3.map((courier, index) => (
          <div
            key={courier.id}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
              index === 0
                ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400 dark:from-yellow-950 dark:to-orange-950"
                : index === 1
                ? "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-400 dark:from-gray-900 dark:to-slate-900"
                : "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-400 dark:from-orange-950 dark:to-amber-950"
            }`}
          >
            <span className="text-2xl flex-shrink-0">{getMedalIcon(index)}</span>
            <Avatar className="h-10 w-10">
              <AvatarImage src={courier.photo_url} />
              <AvatarFallback>{courier.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{courier.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {courier.completed} дост.
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-600 fill-yellow-600" />
                  {courier.rating.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={index === 0 ? "default" : "secondary"}>
                {courier.totalKm.toFixed(1)} км
              </Badge>
            </div>
          </div>
        ))}

        {/* Others - Compact Display */}
        {others.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            {others.map((courier, index) => (
              <div key={courier.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-sm text-muted-foreground font-mono w-6">#{index + 4}</span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={courier.photo_url} />
                  <AvatarFallback className="text-xs">{courier.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{courier.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {courier.completed} • {courier.rating.toFixed(1)}⭐ • {courier.totalKm.toFixed(1)} км
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}