import React, { useState, useEffect } from 'react';
import { Recipe, RecipeIngredient, ExpandedIngredient } from '@/types/recipe';
import { expandRecipeIngredients, getBaseIngredients, getAllergens } from '@/utils/nestedRecipeCalculations';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface NestedRecipeViewProps {
  recipe: Recipe;
}

interface ExpandedIngredientNode {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  depth: number;
  is_semilavorato?: boolean;
  parent_recipe_id?: string;
  parent_recipe_name?: string;
  children?: ExpandedIngredientNode[];
}

const NestedRecipeView: React.FC<NestedRecipeViewProps> = ({ recipe }) => {
  const [expandedIngredients, setExpandedIngredients] = useState<ExpandedIngredientNode[]>([]);
  const [baseIngredients, setBaseIngredients] = useState<ExpandedIngredient[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadExpandedIngredients = async () => {
      try {
        const expanded = await expandRecipeIngredients(recipe);
        const base = getBaseIngredients(expanded);
        const allAllergens = getAllergens(expanded);

        const tree = buildIngredientTree(expanded);

        setExpandedIngredients(tree);
        setBaseIngredients(base);
        setAllergens(allAllergens);
      } catch (error) {
        console.error('Errore nel caricamento degli ingredienti espansi:', error);
        // Imposta valori di fallback
        setExpandedIngredients([]);
        setBaseIngredients([]);
        setAllergens([]);
      }
    };

    if (recipe && recipe.recipe_ingredients) {
      loadExpandedIngredients();
    }
  }, [recipe]);

  const buildIngredientTree = (ingredients: ExpandedIngredient[]): ExpandedIngredientNode[] => {
    const nodeMap = new Map<string, ExpandedIngredientNode>();
    const rootNodes: ExpandedIngredientNode[] = [];

    ingredients.forEach(ing => {
      const node: ExpandedIngredientNode = {
        id: ing.id,
        name: ing.ingredients.name,
        quantity: ing.quantity,
        unit: ing.unit || ing.ingredients.unit,
        depth: ing.depth,
        is_semilavorato: ing.is_semilavorato,
        parent_recipe_id: ing.parent_recipe_id,
        parent_recipe_name: ing.parent_recipe_name,
        children: []
      };

      nodeMap.set(ing.id, node);

      if (ing.parent_recipe_id === recipe.id) {
        rootNodes.push(node);
      } else if (ing.parent_recipe_id) {
        const parent = nodeMap.get(ing.parent_recipe_id);
        if (parent && parent.children) {
          parent.children.push(node);
        }
      }
    });

    return rootNodes;
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderIngredientNode = (node: ExpandedIngredientNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} style={{ marginLeft: `${level * 20}px` }}>
        <div className="flex items-center py-1">
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          {!hasChildren && <span className="w-6" />}
          <span className="flex-1">{node.name}</span>
          <span className="text-sm text-gray-600">
            {node.quantity.toFixed(2)} {node.unit}
          </span>
        </div>
        {isExpanded && hasChildren && (
          <div className="ml-6">
            {node.children?.map(child => renderIngredientNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-semibold">Struttura Ricetta</h3>
        <div className="border rounded-lg p-4 bg-white">
          {expandedIngredients.map(node => renderIngredientNode(node))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Ingredienti Base</h3>
        <div className="border rounded-lg p-4 bg-white">
          {baseIngredients.map(ing => (
            <div key={ing.id} className="flex justify-between py-1">
              <span>{ing.ingredients.name}</span>
              <span className="text-sm text-gray-600">
                {ing.quantity.toFixed(2)} {ing.unit || ing.ingredients.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Allergeni Totali</h3>
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex flex-wrap gap-2">
            {allergens.map(allergen => (
              <span
                key={allergen}
                className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
              >
                {allergen}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NestedRecipeView;