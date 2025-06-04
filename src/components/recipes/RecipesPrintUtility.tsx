
import { calculateTotalCost, calculateCostPerPortion } from '@/utils/recipeCalculations';
import type { Recipe } from '@/types/recipe';

export const printRecipe = (recipe: Recipe) => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    const totalCost = calculateTotalCost(recipe.recipe_ingredients);
    const costPerPortion = calculateCostPerPortion(recipe.recipe_ingredients, recipe.portions);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${recipe.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; }
            .info { background: #f5f5f5; padding: 10px; margin: 10px 0; }
            .ingredients, .instructions { margin: 20px 0; }
            .cost-highlight { background: yellow; font-weight: bold; }
            .semilavorato { color: #9333ea; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${recipe.name} ${recipe.is_semilavorato ? '[SEMILAVORATO]' : ''}</h1>
          <div class="info">
            <strong>Categoria:</strong> ${recipe.category}<br>
            <strong>Tempo preparazione:</strong> ${recipe.preparation_time} minuti<br>
            <strong>Porzioni:</strong> ${recipe.portions}<br>
            <strong>Difficoltà:</strong> ${recipe.difficulty}<br>
            <strong class="cost-highlight">Costo Produzione Totale: €${totalCost.toFixed(2)}</strong><br>
            <strong class="cost-highlight">Costo per Porzione: €${costPerPortion.toFixed(2)}</strong>
            ${recipe.allergens ? `<br><strong>Allergeni:</strong> ${recipe.allergens}` : ''}
          </div>
          
          <div class="ingredients">
            <h2>Ingredienti:</h2>
            <ul>
              ${recipe.recipe_ingredients?.map(ri => {
                const effectiveCost = ri.ingredients.effective_cost_per_unit ?? ri.ingredients.cost_per_unit;
                return `<li${ri.is_semilavorato ? ' class="semilavorato"' : ''}>${ri.is_semilavorato ? '[S] ' : ''}${ri.ingredients.name} - ${ri.quantity}${ri.ingredients.unit} (€${(effectiveCost * ri.quantity).toFixed(2)})</li>`;
              }).join('') || ''}
            </ul>
          </div>
          
          ${recipe.recipe_instructions && recipe.recipe_instructions.length > 0 ? `
            <div class="instructions">
              <h2>Preparazione:</h2>
              <ol>
                ${recipe.recipe_instructions
                  .sort((a, b) => a.step_number - b.step_number)
                  .map(inst => `<li>${inst.instruction}</li>`)
                  .join('')}
              </ol>
            </div>
          ` : ''}
          
          ${recipe.description ? `
            <div>
              <h2>Descrizione:</h2>
              <p>${recipe.description}</p>
            </div>
          ` : ''}
          
          ${recipe.notes_chef ? `
            <div>
              <h2>Note dello Chef:</h2>
              <p>${recipe.notes_chef}</p>
            </div>
          ` : ''}
          
          <div style="margin-top: 20px; font-size: 10px; color: #666;">
            Stampato il: ${new Date().toLocaleString('it-IT')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
};
