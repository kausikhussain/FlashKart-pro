import React, { useState, useEffect } from 'react';
import { Sparkles, Star, ShoppingBag, Plus, ShoppingCart, HelpCircle } from 'lucide-react';
import { Product, CartItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface PersonalShopperProps {
  userId: string;
  cart: CartItem[];
  onAddToCart: (p: Product) => void;
  refreshTrigger: number;
}

export default function PersonalShopper({ userId, cart, onAddToCart, refreshTrigger }: PersonalShopperProps) {
  const [recommendations, setRecommendations] = useState<{ product: Product; reason: string }[]>([]);
  const [hook, setHook] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/recommendations?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
        setHook(data.hook || '');
        setIsAiGenerated(!data.isMock);
      }
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [userId, refreshTrigger]);

  const isInCart = (productId: string) => {
    return cart.some(i => i.product.id === productId);
  };

  return (
    <div id="personal-shopper-root" className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl border border-indigo-500/20">
      {/* Decorative stars and lighting */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-400/20 inline-flex items-center gap-1 mb-2 uppercase tracking-widest font-mono">
            <Sparkles className="w-3 h-3 text-yellow-300" /> Curated By AI
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans">
            Your Personal AI Shopper
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
            {hook || "We analyze your buying habits, brand preferences, and categories to recommend the highest-value local items."}
          </p>
        </div>

        {isAiGenerated && (
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
            <Sparkles className="w-3 h-3" /> Live Gemini Brain Active
          </span>
        )}
      </div>

      {/* Recommendations Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
            <h4 className="font-bold text-sm text-slate-300 font-sans">Curating gourmet choices...</h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed mt-1">We are compiling your buy logs and forecasting matching ingredients.</p>
          </motion.div>
        ) : recommendations.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-slate-400"
          >
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-25" />
            <h4 className="font-semibold text-sm">Shopping list empty</h4>
            <p className="text-xs max-w-xs mx-auto leading-relaxed mt-1">Place an order first to unlock personalized suggestions!</p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10"
          >
            {recommendations.map(({ product, reason }) => (
              <div
                key={product.id}
                className="bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/20 hover:bg-white/10 transition-all duration-300 p-4 flex flex-col justify-between"
              >
                <div>
                  {/* Image */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 mb-3">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{product.rating}</span>
                    </div>
                  </div>

                  <span className="text-[9px] font-mono tracking-wider text-indigo-300 uppercase block font-bold mb-1">
                    {product.category}
                  </span>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{product.name}</h4>
                  
                  {/* AI justification reasoning bubble */}
                  <div className="bg-indigo-950/40 border border-indigo-500/10 p-2.5 rounded-xl mt-2 mb-3">
                    <p className="text-[10px] text-slate-300 leading-relaxed italic">
                      "{reason}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                  <div>
                    <span className="text-sm font-extrabold text-white">₹{product.price.toFixed(2)}</span>
                    <span className="text-slate-400 text-[10px] font-mono"> / {product.unit}</span>
                  </div>

                  <button
                    id={`btn-shopper-add-${product.id}`}
                    onClick={() => onAddToCart(product)}
                    disabled={isInCart(product.id)}
                    className={`p-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer font-bold ${
                      isInCart(product.id)
                        ? 'bg-slate-800 text-slate-400 border border-slate-700 pointer-events-none'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isInCart(product.id) ? 'Added' : 'Basket'}</span>
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
