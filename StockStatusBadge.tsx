
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

export type StockStatus = "ok" | "low" | "critical";

interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

const StockStatusBadge = ({ status, className = "" }: StockStatusBadgeProps) => {
  const getConfig = () => {
    switch (status) {
      case "ok":
        return {
          icon: CheckCircle,
          label: "OK",
          className: "bg-green-100 text-green-800 border-green-200"
        };
      case "low":
        return {
          icon: Clock,
          label: "In Esaurimento",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200"
        };
      case "critical":
        return {
          icon: AlertTriangle,
          label: "Da Riordinare",
          className: "bg-red-100 text-red-800 border-red-200"
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${config.className} ${className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
};

export default StockStatusBadge;
