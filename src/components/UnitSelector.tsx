
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getCompatibleUnits, convertUnit, formatQuantityWithUnit } from "@/utils/unitConversion";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UnitSelectorProps {
  baseUnit: string; // Unità base dell'ingrediente
  selectedUnit: string; // Unità attualmente selezionata
  quantity: number;
  onUnitChange: (unit: string) => void;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
  className?: string;
}

const UnitSelector = ({
  baseUnit,
  selectedUnit,
  quantity,
  onUnitChange,
  onQuantityChange,
  disabled = false,
  className = ""
}: UnitSelectorProps) => {
  const [compatibleUnits, setCompatibleUnits] = useState<string[]>([]);
  const [conversionInfo, setConversionInfo] = useState<string>("");

  useEffect(() => {
    const units = getCompatibleUnits(baseUnit);
    setCompatibleUnits(units);
  }, [baseUnit]);

  useEffect(() => {
    if (selectedUnit !== baseUnit && quantity > 0) {
      const convertedQuantity = convertUnit(quantity, selectedUnit, baseUnit);
      setConversionInfo(`= ${formatQuantityWithUnit(convertedQuantity, baseUnit)}`);
    } else {
      setConversionInfo("");
    }
  }, [selectedUnit, baseUnit, quantity]);

  const handleUnitChange = (newUnit: string) => {
    if (newUnit !== selectedUnit && quantity > 0) {
      // Converte la quantità corrente nella nuova unità
      const convertedQuantity = convertUnit(quantity, selectedUnit, newUnit);
      onQuantityChange(convertedQuantity);
    }
    onUnitChange(newUnit);
  };

  return (
    <TooltipProvider>
      <div className={`space-y-2 ${className}`}>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="number"
              step="0.1"
              placeholder="Quantità"
              value={quantity || ""}
              onChange={(e) => onQuantityChange(parseFloat(e.target.value) || 0)}
              disabled={disabled}
            />
          </div>
          <div className="flex items-center space-x-1">
            <Select value={selectedUnit} onValueChange={handleUnitChange} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Unità" />
              </SelectTrigger>
              <SelectContent>
                {compatibleUnits.map(unit => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                    {unit === baseUnit && <span className="text-xs text-slate-500 ml-1">(base)</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {conversionInfo && (
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Conversione: {conversionInfo}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        {conversionInfo && (
          <div className="text-xs text-slate-500 text-right">
            {conversionInfo}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default UnitSelector;
