
import React from 'react';
import { ChefHat } from 'lucide-react';
import AddRecipeDialog from '@/components/AddRecipeDialog';

interface EmptyRecipeStateProps {
  onAddRecipe: () => void;
  searchTerm: string;
  selectedCategory: string;
}

const EmptyRecipeState: React.FC<EmptyRecipeStateProps> = ({
  onAddRecipe,
  searchTerm,
  selectedCategory
}) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
      <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-slate-600 mb-2">Nessuna ricetta trovata</h3>
      <p className="text-slate-500 mb-6">
        {searchTerm || selectedCategory !== "all" 
          ? "Prova a modificare i filtri di ricerca" 
          : "Inizia creando la tua prima ricetta"
        }
      </p>
      <AddRecipeDialog onAddRecipe={onAddRecipe} />
    </div>
  );
};

export default EmptyRecipeState;
