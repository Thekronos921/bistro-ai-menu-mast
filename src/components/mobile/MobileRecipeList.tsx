
import React, { useState } from 'react';
import { Search, Filter, Plus, ChefHat } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MobileRecipeCard from './MobileRecipeCard';
import RecipeScalingWidget from './RecipeScalingWidget';
import KitchenModeModal from './KitchenModeModal';
import type { Recipe } from '@/types/recipe';

interface MobileRecipeListProps {
  recipes: Recipe[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddRecipe: () => void;
  categories: string[];
}

const MobileRecipeList: React.FC<MobileRecipeListProps> = ({
  recipes,
  searchTerm,
  onSearchChange,
  onAddRecipe,
  categories
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedRecipeForScaling, setSelectedRecipeForScaling] = useState<Recipe | null>(null);
  const [selectedRecipeForKitchen, setSelectedRecipeForKitchen] = useState<Recipe | null>(null);

  const filteredRecipes = recipes.filter(recipe => {
    // Filtro di ricerca
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.category?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Filtro categoria
    if (selectedCategory !== 'all' && recipe.category !== selectedCategory) {
      return false;
    }

    // Filtro difficoltà
    if (selectedDifficulty !== 'all' && recipe.difficulty !== selectedDifficulty) {
      return false;
    }

    return true;
  });

  const difficulties = ['Bassa', 'Media', 'Alta'];

  // Statistiche rapide
  const totalRecipes = recipes.length;
  const semilavoratiCount = recipes.filter(r => r.is_semilavorato).length;
  const avgPreparationTime = recipes.length > 0 
    ? Math.round(recipes.reduce((sum, r) => sum + r.preparation_time, 0) / recipes.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-800">{totalRecipes}</div>
          <div className="text-xs text-purple-600">Ricette Totali</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-800">{semilavoratiCount}</div>
          <div className="text-xs text-blue-600">Semilavorati</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-800">{avgPreparationTime}m</div>
          <div className="text-xs text-green-600">Tempo Medio</div>
        </div>
      </div>

      {/* Search e filtri */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <Input
            placeholder="Cerca ricette..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="whitespace-nowrap"
          >
            Tutte ({totalRecipes})
          </Button>
          
          {categories.map(category => {
            const count = recipes.filter(r => r.category === category).length;
            if (count === 0) return null;
            
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category} ({count})
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="whitespace-nowrap ml-auto"
          >
            <Filter className="w-4 h-4 mr-1" />
            Filtri
          </Button>
        </div>

        {/* Filtri avanzati */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-3">
            <p className="text-sm font-medium text-gray-700">Filtri avanzati</p>
            
            <div>
              <p className="text-xs text-gray-600 mb-2">Difficoltà</p>
              <div className="flex space-x-2">
                <Button
                  variant={selectedDifficulty === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDifficulty('all')}
                >
                  Tutte
                </Button>
                {difficulties.map(difficulty => (
                  <Button
                    key={difficulty}
                    variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDifficulty(difficulty)}
                  >
                    {difficulty}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                }}
                className="flex-1"
              >
                Reset Filtri
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Recipe Button */}
      <Button
        onClick={onAddRecipe}
        className="w-full bg-orange-600 hover:bg-orange-700"
        size="lg"
      >
        <Plus className="w-5 h-5 mr-2" />
        Aggiungi Nuova Ricetta
      </Button>

      {/* Lista ricette */}
      <div className="space-y-3">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <MobileRecipeCard
              key={recipe.id}
              recipe={recipe}
              onViewKitchenMode={(recipe) => setSelectedRecipeForKitchen(recipe)}
              onScale={(recipe) => setSelectedRecipeForScaling(recipe)}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nessuna ricetta trovata</p>
            {searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all' ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm">Prova a modificare i filtri di ricerca</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSearchChange('');
                    setSelectedCategory('all');
                    setSelectedDifficulty('all');
                  }}
                >
                  Rimuovi tutti i filtri
                </Button>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm mb-3">Inizia creando la tua prima ricetta</p>
                <Button
                  onClick={onAddRecipe}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crea Prima Ricetta
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modali */}
      <RecipeScalingWidget
        isOpen={!!selectedRecipeForScaling}
        onClose={() => setSelectedRecipeForScaling(null)}
        recipe={selectedRecipeForScaling}
      />

      <KitchenModeModal
        isOpen={!!selectedRecipeForKitchen}
        onClose={() => setSelectedRecipeForKitchen(null)}
        recipe={selectedRecipeForKitchen}
      />
    </div>
  );
};

export default MobileRecipeList;
