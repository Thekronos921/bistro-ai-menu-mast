
import React from 'react';
import { ArrowLeft, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddRecipeDialog from '@/components/AddRecipeDialog';

interface RecipeHeaderProps {
  onAddRecipe: () => void;
}

const RecipeHeader: React.FC<RecipeHeaderProps> = ({ onAddRecipe }) => {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Mapping Ricette</h1>
                <p className="text-sm text-slate-500">Gestione completa ricette e calcolo costi di produzione</p>
              </div>
            </div>
          </div>
          <AddRecipeDialog onAddRecipe={onAddRecipe} />
        </div>
      </div>
    </header>
  );
};

export default RecipeHeader;
