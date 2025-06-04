
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";

interface RecipeInstruction {
  id: string;
  instruction: string;
}

interface RecipeInstructionsFormProps {
  instructions: RecipeInstruction[];
  onInstructionsChange: (instructions: RecipeInstruction[]) => void;
}

const RecipeInstructionsForm = ({ instructions, onInstructionsChange }: RecipeInstructionsFormProps) => {
  const addInstruction = () => {
    onInstructionsChange([...instructions, { id: crypto.randomUUID(), instruction: "" }]);
  };

  const removeInstruction = (index: number) => {
    onInstructionsChange(instructions.filter((_, i) => i !== index));
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = instructions.map((inst, i) => 
      i === index ? { ...inst, instruction: value } : inst
    );
    onInstructionsChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Preparazione</h3>
        <Button onClick={addInstruction} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Step
        </Button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {instructions.map((instruction, index) => (
          <div key={instruction.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                  {index + 1}
                </span>
                Step {index + 1}
              </span>
              {instructions.length > 1 && (
                <Button onClick={() => removeInstruction(index)} size="sm" variant="outline">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Textarea
              placeholder="Descrivi questo passaggio..."
              value={instruction.instruction}
              onChange={(e) => updateInstruction(index, e.target.value)}
              rows={3}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeInstructionsForm;
