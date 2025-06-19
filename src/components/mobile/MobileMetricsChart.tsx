
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MetricPoint {
  label: string;
  value: number;
  date?: string;
}

interface MobileMetricsChartProps {
  title: string;
  data: MetricPoint[];
  currentValue: number;
  previousValue?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendPercentage?: number;
  className?: string;
}

const MobileMetricsChart: React.FC<MobileMetricsChartProps> = ({
  title,
  data,
  currentValue,
  previousValue,
  unit = '',
  trend = 'neutral',
  trendPercentage,
  className
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'down':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Semplice visualizzazione a barre per mobile
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {trendPercentage !== undefined && (
            <Badge variant="outline" className={getTrendColor()}>
              <div className="flex items-center space-x-1">
                {getTrendIcon()}
                <span className="text-xs">
                  {trendPercentage > 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
                </span>
              </div>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Valore corrente */}
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-800">
              {currentValue.toFixed(1)}{unit}
            </div>
            {previousValue !== undefined && (
              <div className="text-sm text-slate-600 mt-1">
                Precedente: {previousValue.toFixed(1)}{unit}
              </div>
            )}
          </div>

          {/* Mini grafico a barre */}
          <div className="space-y-2">
            <div className="text-xs text-slate-600 mb-2">Trend ultimi periodi</div>
            <div className="flex items-end justify-between space-x-1 h-16">
              {data.slice(-7).map((point, index) => {
                const height = range > 0 
                  ? ((point.value - minValue) / range) * 100 
                  : 50;
                const isLast = index === data.slice(-7).length - 1;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className={cn(
                        "w-full rounded-t transition-all duration-300",
                        isLast ? "bg-blue-500" : "bg-slate-300"
                      )}
                      style={{ height: `${Math.max(height, 10)}%` }}
                    />
                    <div className="text-xs text-slate-500 mt-1 truncate">
                      {point.label.slice(0, 3)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileMetricsChart;
