
import { Input } from "@/components/ui/input";

interface NutritionalInfoFormProps {
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onNutritionalInfoChange: (data: Partial<NutritionalInfoFormProps['nutritionalInfo']>) => void;
}

const NutritionalInfoForm = ({ nutritionalInfo, onNutritionalInfoChange }: NutritionalInfoFormProps) => {
  return (
    <div className="space-y-3">
      <h4 className="font-medium">Valori Nutrizionali (per porzione)</h4>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Calorie (kcal)</label>
          <Input
            type="number"
            value={nutritionalInfo.calories}
            onChange={(e) => onNutritionalInfoChange({calories: parseInt(e.target.value) || 0})}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Proteine (g)</label>
          <Input
            type="number"
            value={nutritionalInfo.protein}
            onChange={(e) => onNutritionalInfoChange({protein: parseInt(e.target.value) || 0})}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Carboidrati (g)</label>
          <Input
            type="number"
            value={nutritionalInfo.carbs}
            onChange={(e) => onNutritionalInfoChange({carbs: parseInt(e.target.value) || 0})}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Grassi (g)</label>
          <Input
            type="number"
            value={nutritionalInfo.fat}
            onChange={(e) => onNutritionalInfoChange({fat: parseInt(e.target.value) || 0})}
          />
        </div>
      </div>
    </div>
  );
};

export default NutritionalInfoForm;
