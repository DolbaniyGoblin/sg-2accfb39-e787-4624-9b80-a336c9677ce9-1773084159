import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface DataPoint {
  label: string;
  value: number;
}

interface StatsChartProps {
  title: string;
  data: DataPoint[];
  valuePrefix?: string;
  valueSuffix?: string;
}

export function StatsChart({ title, data, valuePrefix = "", valueSuffix = "" }: StatsChartProps) {
  const max = useMemo(() => Math.max(...data.map(d => d.value)), [data]);
  const min = useMemo(() => Math.min(...data.map(d => d.value)), [data]);
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const avg = useMemo(() => total / data.length, [total, data.length]);

  const trend = data.length >= 2 ? data[data.length - 1].value - data[data.length - 2].value : 0;
  const trendPercent = data.length >= 2 && data[data.length - 2].value !== 0
    ? ((trend / data[data.length - 2].value) * 100).toFixed(1)
    : "0";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-1 text-sm">
            {trend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={trend >= 0 ? "text-green-600" : "text-red-600"}>
              {trend >= 0 ? "+" : ""}{trendPercent}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Bar Chart */}
        <div className="space-y-2 mb-4">
          {data.map((point, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{point.label}</span>
                <span className="font-semibold">
                  {valuePrefix}{point.value}{valueSuffix}
                </span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(point.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t text-center">
          <div>
            <p className="text-xs text-muted-foreground">Макс</p>
            <p className="font-bold text-sm">{valuePrefix}{max}{valueSuffix}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Средн.</p>
            <p className="font-bold text-sm">{valuePrefix}{avg.toFixed(1)}{valueSuffix}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Всего</p>
            <p className="font-bold text-sm">{valuePrefix}{total}{valueSuffix}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}