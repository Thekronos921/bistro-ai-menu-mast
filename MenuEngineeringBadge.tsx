
import { Star, Truck, HelpCircle, X } from "lucide-react";

export type MenuCategory = "star" | "plowhorse" | "puzzle" | "dog";

interface MenuEngineeringBadgeProps {
  category: MenuCategory;
  className?: string;
}

const MenuEngineeringBadge = ({ category, className = "" }: MenuEngineeringBadgeProps) => {
  const getConfig = () => {
    switch (category) {
      case "star":
        return {
          icon: Star,
          label: "Star",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200"
        };
      case "plowhorse":
        return {
          icon: Truck,
          label: "Plowhorse",
          className: "bg-blue-100 text-blue-800 border-blue-200"
        };
      case "puzzle":
        return {
          icon: HelpCircle,
          label: "Puzzle",
          className: "bg-purple-100 text-purple-800 border-purple-200"
        };
      case "dog":
        return {
          icon: X,
          label: "Dog",
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

export default MenuEngineeringBadge;
