
import { useState } from "react";
import { ArrowLeft, Plus, Search, ChefHat, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Recipes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const recipes = [
    {
      id: 1,
      name: "Risotto ai Porcini",
      category: "Primi Piatti",
      preparationTime: 25,
      difficulty: "Media",
      portions: 4,
      ingredients: [
        { name: "Riso Carnaroli", quantity: 320, unit: "g", cost: 1.20 },
        { name: "Porcini freschi", quantity: 200, unit: "g", cost: 2.80 },
        { name: "Brodo vegetale", quantity: 1, unit: "l", cost: 0.50 },
        { name: "Vino bianco", quantity: 100, unit: "ml", cost: 0.35 }
      ],
      totalCost: 4.85,
      instructions: [
        "Pulire e tagliare i porcini",
        "Tostare il riso con cipolla",
        "Aggiungere vino e brodo gradualmente",
        "Manteccare con burro e parmigiano"
      ],
      nutritionalInfo: {
        calories: 380,
        protein: 12,
        carbs: 68,
        fat: 8
      }
    },
    {
      id: 2,
      name: "Branzino in Crosta",
      category: "Secondi Piatti",
      preparationTime: 45,
      difficulty: "Alta",
      portions: 2,
      ingredients: [
        { name: "Branzino intero", quantity: 800, unit: "g", cost: 6.40 },
        { name: "Crosta di sale", quantity: 500, unit: "g", cost: 0.80 },
        { name: "Erbe aromatiche", quantity: 50, unit: "g", cost: 1.00 }
      ],
      totalCost: 8.20,
      instructions: [
        "Pulire il branzino",
        "Preparare la crosta di sale con erbe",
        "Avvolgere il pesce nella crosta",
        "Cuocere in forno a 180°C per 35 minuti"
      ],
      nutritionalInfo: {
        calories: 220,
        protein: 42,
        carbs: 2,
        fat: 6
      }
    }
  ];

  const categories = ["all", "Antipasti", "Primi Piatti", "Secondi Piatti", "Dolci", "Contorni"];

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Bassa": return "bg-emerald-100 text-emerald-800";
      case "Media": return "bg-amber-100 text-amber-800";
      case "Alta": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50">
      {/* Header */}
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
                  <p className="text-sm text-slate-500">Gestione completa ricette e ingredienti</p>
                </div>
              </div>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Nuova Ricetta</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cerca ricette..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? "bg-purple-600 text-white"
                      : "bg-stone-100 text-slate-600 hover:bg-stone-200"
                  }`}
                >
                  {category === "all" ? "Tutte" : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Recipe Header */}
              <div className="p-6 border-b border-stone-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{recipe.name}</h3>
                    <p className="text-sm text-slate-500">{recipe.category}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(recipe.difficulty)}`}>
                    {recipe.difficulty}
                  </span>
                </div>
                
                <div className="flex items-center space-x-6 mt-4 text-sm text-slate-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.preparationTime} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{recipe.portions} porzioni</span>
                  </div>
                  <div className="font-semibold text-purple-600">
                    €{recipe.totalCost.toFixed(2)} totale
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div className="p-6 border-b border-stone-200">
                <h4 className="font-semibold text-slate-800 mb-3">Ingredienti</h4>
                <div className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">
                        {ingredient.name} - {ingredient.quantity}{ingredient.unit}
                      </span>
                      <span className="font-medium text-slate-800">€{ingredient.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="p-6 border-b border-stone-200">
                <h4 className="font-semibold text-slate-800 mb-3">Preparazione</h4>
                <ol className="space-y-2">
                  {recipe.instructions.map((step, index) => (
                    <li key={index} className="flex items-start space-x-3 text-sm text-slate-600">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Nutritional Info */}
              <div className="p-6 bg-stone-50">
                <h4 className="font-semibold text-slate-800 mb-3">Valori Nutrizionali (per porzione)</h4>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{recipe.nutritionalInfo.calories}</p>
                    <p className="text-xs text-slate-500">Calorie</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{recipe.nutritionalInfo.protein}g</p>
                    <p className="text-xs text-slate-500">Proteine</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{recipe.nutritionalInfo.carbs}g</p>
                    <p className="text-xs text-slate-500">Carboidrati</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{recipe.nutritionalInfo.fat}g</p>
                    <p className="text-xs text-slate-500">Grassi</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Recipes;
