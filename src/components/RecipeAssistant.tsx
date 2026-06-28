import React, { useState } from 'react';
import { ChefHat, Search, Sparkles, Check, ShoppingCart, Plus, HelpCircle } from 'lucide-react';
import { Product, Recipe } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface RecipeAssistantProps {
  onAddMultipleToCart: (items: { product: Product; quantity: number }[]) => void;
}

export default function RecipeAssistant({ onAddMultipleToCart }: RecipeAssistantProps) {
  const [recipeQuery, setRecipeQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState('');
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  const presets = [
    { title: 'Classic Spaghetti Carbonara 🍝', query: 'Spaghetti Carbonara' },
    { title: 'Organic Fruit Salad 🍓', query: 'fruit salad' },
    { title: 'Ribeye Steak Night 🥩', query: 'steak night' }
  ];

  const handleFetchRecipe = async (queryStr: string) => {
    if (!queryStr.trim()) return;
    setLoading(true);
    setError('');
    setRecipe(null);

    try {
      const res = await fetch('/api/ai/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipePrompt: queryStr })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to craft recipe');
      
      setRecipe(data.recipe);
      setIsAiGenerated(!data.isMock);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllToCart = () => {
    if (!recipe) return;
    const itemsToAdd = recipe.ingredients
      .filter(i => i.matchedProduct)
      .map(i => ({
        product: i.matchedProduct!,
        quantity: 1 // default to 1 item
      }));

    if (itemsToAdd.length > 0) {
      onAddMultipleToCart(itemsToAdd);
      alert(`Success! Added ${itemsToAdd.length} fresh ingredients straight into your basket! 🎉`);
    }
  };

  // Calculate matched total cost
  const matchedTotal = recipe
    ? recipe.ingredients
        .filter(i => i.matchedProduct)
        .reduce((sum, i) => sum + i.matchedProduct!.price, 0)
    : 0;

  return (
    <div id="recipe-assistant-root" className="grid lg:grid-cols-12 gap-8">
      {/* Left Column: Input and Presets */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ChefHat className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm font-sans">AI Recipe Assistant</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-6">
            Type any meal name (e.g. "Avocado Toast", "Salmon steak", or a custom recipe). The AI will break down ingredients, match them instantly to Fresh Kart's real inventory, and let you add them in one tap!
          </p>

          <div className="relative">
            <input
              id="recipe-input"
              type="text"
              placeholder="e.g. Homemade Sourdough Pizza..."
              value={recipeQuery}
              onChange={(e) => setRecipeQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchRecipe(recipeQuery)}
              className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:border-indigo-500 rounded-xl py-3 pl-4 pr-12 text-xs text-gray-900 transition-all"
            />
            <button
              id="btn-search-recipe"
              onClick={() => handleFetchRecipe(recipeQuery)}
              disabled={loading}
              className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block mb-3">Popular recipe presets</span>
            <div className="space-y-2">
              {presets.map((preset, index) => (
                <button
                   key={index}
                  id={`btn-preset-${index}`}
                  onClick={() => {
                    setRecipeQuery(preset.query);
                    handleFetchRecipe(preset.query);
                  }}
                  className="w-full text-left bg-gray-50 hover:bg-indigo-50 hover:text-indigo-800 p-3 rounded-xl text-xs font-semibold text-gray-700 transition-colors border border-transparent hover:border-indigo-100 cursor-pointer flex items-center justify-between"
                >
                  <span>{preset.title}</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Results Display */}
      <div className="lg:col-span-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]"
            >
              <div className="relative mb-4">
                <ChefHat className="w-12 h-12 text-indigo-600 animate-bounce" />
                <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-2 animate-pulse" />
              </div>
              <h4 className="font-bold text-gray-800 text-sm font-sans">AI is cooking up your grocery list...</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-sm leading-relaxed">
                We are generating ingredients and scanning current Fresh Kart warehouse inventory for closest matches.
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 p-8 rounded-3xl border border-red-100 text-center text-red-600 min-h-[400px] flex flex-col items-center justify-center"
            >
              <p className="text-sm font-semibold">{error}</p>
              <button
                onClick={() => handleFetchRecipe(recipeQuery)}
                className="mt-4 px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 transition-colors cursor-pointer"
              >
                Retry Request
              </button>
            </motion.div>
          ) : recipe ? (
            <motion.div
              key="recipe"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-50 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-gray-900 text-xl font-sans">{recipe.name}</h3>
                    {isAiGenerated ? (
                      <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-700" /> Real Gemini API
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        Smart Recipe Synthesizer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-xl">{recipe.description}</p>
                </div>

                {matchedTotal > 0 && (
                  <button
                    id="btn-add-recipe-ingredients"
                    onClick={handleAddAllToCart}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add All Matched (₹{matchedTotal.toFixed(2)})
                  </button>
                )}
              </div>

              {/* Ingredients and Matches Grid */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 text-sm font-sans flex items-center gap-1.5">
                  <span>Required Ingredients & Inventory Matching</span>
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {recipe.ingredients.map((ing, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        ing.matchedProduct ? 'bg-indigo-50/10 border-indigo-100' : 'bg-gray-50/50 border-gray-100'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-800 block truncate">{ing.name}</span>
                        <span className="text-[10px] font-medium text-gray-400 font-mono block mt-0.5">{ing.amount}</span>
                      </div>

                      {ing.matchedProduct ? (
                        <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/30 p-1.5 rounded-xl">
                          <img
                            src={ing.matchedProduct.imageUrl}
                            alt={ing.matchedProduct.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="text-right flex-shrink-0">
                            <span className="text-[10px] font-bold text-indigo-800 block truncate max-w-[80px]">
                              {ing.matchedProduct.name}
                            </span>
                            <span className="text-[10px] font-extrabold text-indigo-900 block mt-0.5">
                              ₹{ing.matchedProduct.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                          Not Carried
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preparation Instructions */}
              <div className="border-t border-gray-50 pt-6 space-y-4">
                <h4 className="font-bold text-gray-900 text-sm font-sans">Preparation Steps</h4>
                <ol className="space-y-3.5 list-none">
                  {recipe.instructions.map((step, idx) => (
                    <li key={idx} className="flex gap-4">
                      <div className="w-5.5 h-5.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed pt-0.5">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center p-12 min-h-[400px]"
            >
              <ChefHat className="w-14 h-14 text-indigo-100 mb-3" />
              <h4 className="font-bold text-gray-700 text-sm font-sans">No recipe analyzed yet</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-sm leading-relaxed">
                Type a meal request on the left or select a rapid-demo preset to see our AI Recipe Assistant instantly match grocery lists!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
