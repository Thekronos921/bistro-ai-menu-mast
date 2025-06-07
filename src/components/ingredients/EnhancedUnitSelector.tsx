
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Calculator } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { getCompatibleUnitsForPrimary, convertQuantity, formatQuantityDisplay, UnitConversionError } from "@/utils/enhancedUnitConversion";
import type { EnhancedIngredient } from "@/types/ingredient";

interface EnhancedUnitSelectorProps {
  ingredient: EnhancedIngredient;
  quantity: number;
  selectedUnit: string;
  onQuantityChange: (quantity: number) => void;
  onUnitChange: (unit: string) => void;
  disabled?: boolean;
  showConversionInfo?: boolean;
  className?: string;
}

const EnhancedUnitSelector = ({
  ingredient,
  quantity,
  selectedUnit,
  onQuantityChange,
  onUnitChange,
  disabled = false,
  showConversionInfo = true,
  className = ""
}: EnhancedUnitSelectorProps) => {
  const [conversionInfo, setConversionInfo] = useState<string>("");
  const [conversionError, setConversionError] = useState<string>("");
  
  const compatibleUnits = getCompatibleUnitsForPrimary(ingredient.primary_unit);
  const effectiveUsageUnit = ingredient.usage_unit || ingredient.primary_unit;

  useEffect(() => {
    if (!showConversionInfo || quantity <= 0) {
      setConversionInfo("");
      setConversionError("");
      return;
    }

    if (selectedUnit === ingredient.primary_unit) {
      setConversionInfo("");
      setConversionError("");
      return;
    }

    try {
      const conversionData = {
        averageWeightPerPieceG: ingredient.average_weight_per_piece_g,
        averagePiecesPerKg: ingredient.average_pieces_per_kg
      };

      const convertedQuantity = convertQuantity(
        quantity,
        selectedUnit,
        ingredient.primary_unit,
        conversionData
      );

      setConversionInfo(
        `= ${formatQuantityDisplay(convertedQuantity, ingredient.primary_unit, true)}`
      );
      setConversionError("");
    } catch (error) {
      if (error instanceof UnitConversionError) {
        setConversionError(error.message);
        setConversionInfo("");
      }
    }
  }, [selectedUnit, quantity, ingredient, showConversionInfo]);

  return (
    <TooltipProvider>
      <div className={`space-y-3 ${className}`}>
        {/* Intestazione con info unità */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Quantità</Label>
          {effectiveUsageUnit !== ingredient.primary_unit && (
            <Badge variant="outline" className="text-xs">
              Unità preferita: {effectiveUsageUnit}
            </Badge>
          )}
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-xs">
                <p><strong>Unità di acquisto:</strong> {ingredient.primary_unit}</p>
                <p><strong>Unità preferita per ricette:</strong> {effectiveUsageUnit}</p>
                {ingredient.average_weight_per_piece_g && (
                  <p><strong>Peso medio per pezzo:</strong> {ingredient.average_weight_per_piece_g}g</p>
                )}
                {ingredient.last_lot_conversion_update && (
                  <p className="text-green-600">
                    <strong>Conversioni aggiornate dal lotto del:</strong>{" "}
                    {new Date(ingredient.last_lot_conversion_update).toLocaleDateString('it-IT')}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Input quantità e selettore unità */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="number"
              step="0.1"
              placeholder={`Quantità in ${selectedUnit}`}
              value={quantity || ""}
              onChange={(e) => onQuantityChange(parseFloat(e.target.value) || 0)}
              disabled={disabled}
              className={conversionError ? "border-red-500" : ""}
            />
          </div>
          <div className="flex items-center space-x-1">
            <Select 
              value={selectedUnit} 
              onValueChange={onUnitChange} 
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unità" />
              </SelectTrigger>
              <SelectContent>
                {compatibleUnits.map(unit => (
                  <SelectItem key={unit.code} value={unit.code}>
                    <div className="flex items-center gap-2">
                      <span>{unit.name}</span>
                      {unit.code === ingredient.primary_unit && (
                        <Badge variant="secondary" className="text-xs">UMP</Badge>
                      )}
                      {unit.code === effectiveUsageUnit && unit.code !== ingredient.primary_unit && (
                        <Badge variant="default" className="text-xs">UUS</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {conversionInfo && (
              <Tooltip>
                <TooltipTrigger>
                  <Calculator className="w-4 h-4 text-green-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Conversione: {conversionInfo}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Info conversione */}
        {conversionInfo && (
          <div className="text-xs text-green-600 text-right">
            {conversionInfo}
          </div>
        )}

        {/* Errore conversione */}
        {conversionError && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>{conversionError}</span>
            </div>
            {selectedUnit === 'pz' && !ingredient.average_weight_per_piece_g && (
              <p className="mt-1">
                Per utilizzare i pezzi, carica un lotto specificando il numero di pezzi ricevuti.
              </p>
            )}
          </div>
        )}

        {/* Suggerimento per l'unità preferita */}
        {selectedUnit !== effectiveUsageUnit && effectiveUsageUnit !== ingredient.primary_unit && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>
                Unità raccomandata per questo ingrediente: <strong>{effectiveUsageUnit}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default EnhancedUnitSelector;
