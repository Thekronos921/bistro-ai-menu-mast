
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCompatibleUnits, convertQuantity, formatQuantityWithUnit, normalizeToBaseUnit } from "@/utils/unitConversions";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UnitSelectorProps {
  quantity: number;
  unit: string;
  baseUnit: string; // Unità base dell'ingrediente
  onQuantityChange: (quantity: number) => void;
  onUnitChange: (unit: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  showConversionInfo?: boolean;
}

const UnitSelector = ({
  quantity,
  unit,
  baseUnit,
  onQuantityChange,
  onUnitChange,
  label = "Quantità",
  placeholder = "0",
  disabled = false,
  showConversionInfo = true
}: UnitSelectorProps) => {
  const [displayQuantity, setDisplayQuantity] = useState(quantity);
  const [displayUnit, setDisplayUnit] = useState(unit);
  
  const compatibleUnits = getCompatibleUnits(baseUnit);

  useEffect(() => {
    setDisplayQuantity(quantity);
    setDisplayUnit(unit);
  }, [quantity, unit]);

  const handleQuantityChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setDisplayQuantity(numValue);
    
    // Converti alla unità base per il salvataggio
    const normalized = normalizeToBaseUnit(numValue, displayUnit, baseUnit);
    onQuantityChange(normalized.quantity);
  };

  const handleUnitChange = (newUnit: string) => {
    // Converti la quantità attuale nella nuova unità
    const convertedQuantity = convertQuantity(displayQuantity, displayUnit, newUnit);
    
    setDisplayQuantity(convertedQuantity);
    setDisplayUnit(newUnit);
    
    // Salva sempre nella unità base
    const normalized = normalizeToBaseUnit(convertedQuantity, newUnit, baseUnit);
    onQuantityChange(normalized.quantity);
    onUnitChange(newUnit);
  };

  const getConversionInfo = () => {
    if (!showConversionInfo || displayUnit === baseUnit) return null;
    
    const baseQuantity = convertQuantity(displayQuantity, displayUnit, baseUnit);
    return formatQuantityWithUnit(baseQuantity, baseUnit);
  };

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <Label className="flex items-center space-x-1">
          <span>{label}</span>
          {showConversionInfo && getConversionInfo() && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Equivale a: {getConversionInfo()}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </Label>
        
        <div className="flex space-x-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={displayQuantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1"
          />
          
          <Select value={displayUnit} onValueChange={handleUnitChange} disabled={disabled}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {compatibleUnits.map((unitConfig) => (
                <SelectItem key={unitConfig.unit} value={unitConfig.unit}>
                  {unitConfig.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {showConversionInfo && getConversionInfo() && displayUnit !== baseUnit && (
          <p className="text-xs text-gray-500">
            = {getConversionInfo()}
          </p>
        )}
      </div>
    </TooltipProvider>
  );
};

export default UnitSelector;
