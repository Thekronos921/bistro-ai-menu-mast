
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  progress?: number;
}

const KPICard = ({ title, value, subtitle, icon: Icon, trend, progress }: KPICardProps) => {
  const getTrendColor = () => {
    switch (trend) {
      case "up": return "text-emerald-500";
      case "down": return "text-red-500";
      default: return "text-slate-500";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
      {subtitle && (
        <div className="flex items-center">
          <span className={`text-sm ${getTrendColor()}`}>{subtitle}</span>
        </div>
      )}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default KPICard;
