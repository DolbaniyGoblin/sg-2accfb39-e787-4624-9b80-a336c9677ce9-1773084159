import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface CourierStats {
  id: string;
  full_name: string;
  photo_url: string | null;
  completed: number;
  distance: number;
  rating: number;
}

interface CourierLeaderboardProps {
  couriers: CourierStats[];
  period: string;
}

export function CourierLeaderboard({ couriers, period }: CourierLeaderboardProps) {
  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-500/20 border-yellow-500/30";
      case 1:
        return "bg-gray-400/20 border-gray-400/30";
      case 2:
        return "bg-orange-600/20 border-orange-600/30";
      default:
        return "bg-gray-700/20 border-gray-700/30";
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg text-white">
          🏆 Топ курьеров {period === "day" ? "за сегодня" : period === "week" ? "за неделю" : "за месяц"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {couriers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Нет данных за выбранный период
          </div>
        ) : (
          <div className="space-y-3">
            {couriers.map((courier, index) => (
              <div
                key={courier.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${getMedalColor(
                  index
                )}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0">
                    {getMedalIcon(index) || (
                      <div className="w-5 h-5 flex items-center justify-center text-gray-500 font-bold">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={courier.photo_url || undefined} />
                    <AvatarFallback>{courier.full_name[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {courier.full_name}
                    </p>
                    <p className="text-sm text-gray-400">
                      {courier.distance.toFixed(1)} км
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                  >
                    {courier.completed} 📦
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-blue-500/20 text-blue-500 border-blue-500/30"
                  >
                    ⭐ {courier.rating.toFixed(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}