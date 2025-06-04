
import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type TimePeriod = "today" | "yesterday" | "last7days" | "last30days" | "custom";

interface PeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

const PeriodSelector = ({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) => {
  const periods = [
    { value: "today" as const, label: "Oggi" },
    { value: "yesterday" as const, label: "Ieri" },
    { value: "last7days" as const, label: "Ultimi 7 giorni" },
    { value: "last30days" as const, label: "Ultimi 30 giorni" },
    { value: "custom" as const, label: "Periodo Personalizzato" },
  ];

  const getCurrentLabel = () => {
    return periods.find(p => p.value === selectedPeriod)?.label || "Seleziona periodo";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span>{getCurrentLabel()}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 bg-white">
        {periods.map((period) => (
          <DropdownMenuItem
            key={period.value}
            onClick={() => onPeriodChange(period.value)}
            className={selectedPeriod === period.value ? "bg-emerald-50 text-emerald-700" : ""}
          >
            {period.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PeriodSelector;
