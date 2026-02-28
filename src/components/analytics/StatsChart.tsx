import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataPoint {
  label: string;
  value: number;
}

interface StatsChartProps {
  title: string;
  data: DataPoint[];
  type?: "bar" | "line";
  color?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function StatsChart({
  title,
  data,
  type = "bar",
  color = "#eab308",
  valuePrefix = "",
  valueSuffix = "",
}: StatsChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((point, index) => {
            const percentage = (point.value / maxValue) * 100;
            const prevValue = index > 0 ? data[index - 1].value : point.value;
            
            return (
              <div key={point.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{point.label}</span>
                  <span className="font-semibold text-white">
                    {valuePrefix}{point.value}{valueSuffix}
                  </span>
                </div>
                
                {type === "bar" ? (
                  <div className="h-8 bg-gray-700/30 rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-500 flex items-center justify-end px-2"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    >
                      {percentage > 15 && (
                        <span className="text-xs font-bold text-white">
                          {point.value}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative h-8 flex items-end">
                    {index > 0 && (
                      <svg
                        className="absolute inset-0 w-full h-full"
                        style={{ zIndex: 1 }}
                      >
                        <line
                          x1="0%"
                          y1={`${100 - (prevValue / maxValue) * 100}%`}
                          x2="100%"
                          y2={`${100 - (point.value / maxValue) * 100}%`}
                          stroke={color}
                          strokeWidth="2"
                        />
                      </svg>
                    )}
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: "8px",
                        height: "8px",
                        backgroundColor: color,
                        bottom: `${(point.value / maxValue) * 100}%`,
                        left: "50%",
                        transform: "translate(-50%, 50%)",
                        zIndex: 2,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Итого</span>
            <p className="text-xl font-bold text-white">
              {valuePrefix}{total}{valueSuffix}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}