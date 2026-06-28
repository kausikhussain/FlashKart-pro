import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Sparkles, ShoppingCart, Star, Plus, Minus } from 'lucide-react';
import { Product, CartItem } from '../types';
import { motion } from 'motion/react';

interface ShopViewProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (product: Product) => void;
  onUpdateQuantity: (product: Product, quantity: number) => void;
}

export default function ShopView({
  products,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onUpdateQuantity,
}: ShopViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('popular');

  const categories = ['All', 'Fresh Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Beverages', 'Bakery & Snacks'];

  // Filter & Sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [products, searchTerm, selectedCategory, sortBy]);

  // Helper to check item quantity in cart
  const getCartQuantity = (productId: string) => {
    const item = cart.find(i => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div id="shop-view-root" className="space-y-6">
      {/* High-fidelity Promo Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative bg-gradient-to-r from-indigo-600 to-indigo-900 rounded-3xl p-6 md:p-10 text-white overflow-hidden shadow-xl"
      >
        <div className="absolute top-0 right-0 w-[300px] h-full opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <span className="bg-indigo-500/30 text-indigo-100 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-400/20 inline-flex items-center gap-1 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Weekend Special Offer
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            Eat Fresh. Save Big. 🛒
          </h2>
          <p className="text-indigo-100/90 text-sm md:text-base leading-relaxed mb-6">
            Get ultra-fresh organic food sourced from trusted family farms straight to your door. Use code <span className="font-mono bg-indigo-500/50 px-2 py-0.5 rounded text-white font-bold">FRESH10</span> for 10% off, or <span className="font-mono bg-indigo-500/50 px-2 py-0.5 rounded text-white font-bold">SUPERKART</span> for ₹150 off on orders above ₹500.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedCategory('Fresh Produce')}
              className="bg-white hover:bg-indigo-50 text-indigo-800 font-bold px-5 py-2.5 rounded-xl text-xs tracking-tight shadow-md transition-all cursor-pointer"
            >
              Shop Produce Now
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="shop-search"
            type="text"
            placeholder="Search fresh vegetables, steaks, sourdough, cold brew..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-4 text-xs text-gray-900 transition-all"
          />
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Sort by:</span>
          <select
            id="shop-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:bg-white focus:border-indigo-500 cursor-pointer"
          >
            <option value="popular">Popular Favorites</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="overflow-x-auto pb-2 flex gap-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`btn-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex-shrink-0 cursor-pointer border ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div id="product-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-100">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <h4 className="text-sm font-bold text-gray-700">No items found</h4>
            <p className="text-xs mt-1">Try modifying your search query or choosing another category.</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const qty = getCartQuantity(product.id);
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= 25;

            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group relative"
              >
                {/* Product Image */}
                <div className="relative aspect-video bg-gray-50 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="text-white text-xs font-extrabold bg-red-600 px-3 py-1 rounded-full uppercase tracking-wider">
                        Out of Stock
                      </span>
                    </div>
                  )}
                  {isLowStock && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md">
                      Only {product.stock} left
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                        {product.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-gray-700">{product.rating}</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold text-gray-900">
                        ₹{product.price.toFixed(2)}
                      </span>
                      <span className="text-gray-400 text-xs font-medium font-mono">
                        &nbsp;/ {product.unit}
                      </span>
                    </div>

                    {/* Add to Cart Actions */}
                    {!isOutOfStock && (
                      <div className="flex items-center">
                        {qty === 0 ? (
                          <button
                            id={`btn-add-${product.id}`}
                            onClick={() => onAddToCart(product)}
                            className="bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white transition-all p-2 rounded-xl cursor-pointer flex items-center gap-1 font-semibold text-xs border border-indigo-100 hover:border-indigo-600 shadow-sm"
                          >
                            <Plus className="w-4 h-4" /> Add
                          </button>
                        ) : (
                          <div className="flex items-center bg-indigo-50 border border-indigo-100 rounded-xl p-1 shadow-inner gap-2">
                            <button
                              id={`btn-dec-${product.id}`}
                              onClick={() => onUpdateQuantity(product, qty - 1)}
                              className="p-1 hover:bg-indigo-600 hover:text-white rounded-lg text-indigo-700 transition-all cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold text-indigo-800 w-4 text-center">
                              {qty}
                            </span>
                            <button
                              id={`btn-inc-${product.id}`}
                              disabled={qty >= product.stock}
                              onClick={() => onUpdateQuantity(product, qty + 1)}
                              className="p-1 hover:bg-indigo-600 hover:text-white rounded-lg text-indigo-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-indigo-700 transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
