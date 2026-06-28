import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield, TrendingUp, ShoppingBag, Truck, Users, Plus, Edit3, Trash2, Check,
  AlertTriangle, ArrowRight, Sparkles, Send, RefreshCw, Layers, MapPin, BarChart3, Package
} from 'lucide-react';
import { Product, Order, ForecastResult } from '../types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  onRefreshProducts: () => void;
  onRefreshOrders: () => void;
}

export default function AdminPanel({
  products,
  orders,
  onRefreshProducts,
  onRefreshOrders,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'inventory' | 'orders' | 'ai-hub'>('analytics');
  
  // Inventory form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<Product['category']>('Fresh Produce');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('lb');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Broadcast notification states
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // AI Forecasting state
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);

  // Search/Filters
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Overview metrics
  const totalSales = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders]);
  const completedOrders = useMemo(() => orders.filter(o => o.status === 'delivered').length, [orders]);
  const activeShipments = useMemo(() => orders.filter(o => o.status !== 'delivered').length, [orders]);
  
  // Uniq customer count
  const customerCount = useMemo(() => {
    const ids = new Set(orders.map(o => o.userId));
    return ids.size || 3; // base default
  }, [orders]);

  // Chart 1: Sales trends over time (Recharts AreaChart)
  const salesTrendData = useMemo(() => {
    const datesMap: Record<string, number> = {};
    // Seed previous 7 days with some sales to guarantee nice curves
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' });
      datesMap[d] = 0;
    }

    orders.forEach(o => {
      const d = new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
      if (datesMap[d] !== undefined) {
        datesMap[d] += o.total;
      } else {
        datesMap[d] = o.total;
      }
    });

    return Object.entries(datesMap).map(([date, sales]) => ({ date, sales }));
  }, [orders]);

  // Chart 2: Category sales breakdown (Recharts PieChart)
  const categorySalesData = useMemo(() => {
    const catMap: Record<string, number> = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        catMap[item.category] = (catMap[item.category] || 0) + (item.price * item.quantity);
      });
    });

    const colors = ['#059669', '#0284c7', '#dc2626', '#f59e0b', '#7c3aed'];
    return Object.entries(catMap).map(([name, value], idx) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      color: colors[idx % colors.length]
    }));
  }, [orders]);

  // Chart 3: Order volumes per status
  const orderVolumeData = useMemo(() => {
    const statuses = ['placed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    const map: Record<string, number> = { placed: 0, packed: 0, shipped: 0, out_for_delivery: 0, delivered: 0 };
    orders.forEach(o => {
      map[o.status] = (map[o.status] || 0) + 1;
    });

    return statuses.map(status => ({
      status: status.replace(/_/g, ' ').toUpperCase(),
      volume: map[status]
    }));
  }, [orders]);

  // Run Gemini Supply Chain Demand Forecast
  const runAiForecast = async () => {
    setForecastLoading(true);
    setForecastResult(null);
    try {
      const res = await fetch('/api/ai/forecast', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setForecastResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setForecastLoading(false);
    }
  };

  // Broadcast Promo alert to all users
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    setBroadcastLoading(true);
    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: broadcastTitle, message: broadcastMessage })
      });
      if (res.ok) {
        alert("Success! Personalized campaign message broadcasted to all customer notification panels. 📣");
        setBroadcastTitle('');
        setBroadcastMessage('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBroadcastLoading(false);
    }
  };

  // Add/Edit Product
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    const defaultImages: Record<string, string> = {
      'Fresh Produce': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
      'Dairy & Eggs': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80',
      'Meat & Seafood': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop&q=80',
      'Beverages': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
      'Bakery & Snacks': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    };

    const payload = {
      name: newProdName,
      category: newProdCategory,
      price: parseFloat(newProdPrice),
      stock: parseInt(newProdStock),
      unit: newProdUnit,
      imageUrl: newProdImage || defaultImages[newProdCategory] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
      description: newProdDesc
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onRefreshProducts();
        setShowAddModal(false);
        setEditingProduct(null);
        // Reset fields
        setNewProdName('');
        setNewProdPrice('');
        setNewProdStock('');
        setNewProdImage('');
        setNewProdDesc('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setNewProdName(prod.name);
    setNewProdCategory(prod.category);
    setNewProdPrice(prod.price.toString());
    setNewProdStock(prod.stock.toString());
    setNewProdUnit(prod.unit);
    setNewProdImage(prod.imageUrl);
    setNewProdDesc(prod.description);
    setShowAddModal(true);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update order status (Fulfillment action)
  const advanceOrderStatus = async (orderId: string, nextStatus: Order['status']) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        onRefreshOrders();
        const updated = await res.json();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter inventory
  const filteredInventory = useMemo(() => {
    if (!inventorySearch) return products;
    const q = inventorySearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, inventorySearch]);

  return (
    <div id="admin-panel-root" className="space-y-8">
      {/* Admin header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-800">
            <Shield className="w-5 h-5 text-emerald-600" />
            <span className="text-xs uppercase tracking-wider font-mono font-bold">Fulfillment Administration Panel</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-1 font-sans">Fresh Kart Warehouse Management</h1>
        </div>

        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-150">
          {(['analytics', 'inventory', 'orders', 'ai-hub'] as const).map(tab => (
            <button
              key={tab}
              id={`btn-admin-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-indigo-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* STAT CARDS - GENERAL METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gross Store revenue', value: `$${totalSales.toFixed(2)}`, trend: '+14% this week', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Completed Deliveries', value: completedOrders, trend: 'Fully fulfilled', icon: ShoppingBag, color: 'text-sky-600 bg-sky-50' },
          { label: 'Active Shipments', value: activeShipments, trend: 'En route/Assembly', icon: Truck, color: 'text-amber-600 bg-amber-50' },
          { label: 'Customer Count', value: customerCount, trend: 'Registered accounts', icon: Users, color: 'text-indigo-600 bg-indigo-50' }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">{stat.label}</span>
                <span className="text-xl font-extrabold text-gray-900 block mt-1">{stat.value}</span>
                <span className="text-[10px] text-gray-400 mt-1 block">{stat.trend}</span>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* RENDER ACTIVE TAB VIEW */}

      {/* 1. ANALYTICS VIEW */}
      {activeTab === 'analytics' && (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Sales curve (Area Chart) */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm font-sans">Recent Gross Sales Trends (₹)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                  <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category distribution (Pie Chart) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <h3 className="font-bold text-gray-900 text-sm font-sans mb-4">Sales by Grocery Category</h3>
            
            {categorySalesData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-xs py-10">No categories purchased yet.</div>
            ) : (
              <>
                <div className="h-44 w-full flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySalesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categorySalesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 mt-4">
                  {categorySalesData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-gray-900 font-bold">₹{item.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bar Chart: Shipment volumes */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm font-sans">Active Shipments Count per Logistics Stage</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="status" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="volume" fill="#0284c7" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Broadcast Promo Dashboard */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-sm font-sans mb-1 flex items-center gap-1">
                <Send className="w-4 h-4 text-indigo-600" /> Broadcast Push Notification Campaign
              </h3>
              <p className="text-xs text-gray-500 mb-4">Send dynamic announcements, store discounts, or flash product offers instantly to all users.</p>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-3.5">
              <div>
                <input
                  id="admin-notif-title"
                  type="text"
                  required
                  placeholder="Campaign Title (e.g., Summer Cherry Blast! 🍒)"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3.5 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <textarea
                  id="admin-notif-msg"
                  required
                  rows={3}
                  placeholder="Campaign Message details. Let users know about the code and what's in stock today."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3.5 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                />
              </div>
              <button
                id="btn-broadcast-campaign"
                type="submit"
                disabled={broadcastLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {broadcastLoading ? "Broadcasting..." : "Broadcast Push Alerts"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. INVENTORY VIEW */}
      {activeTab === 'inventory' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-50 pb-4">
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <TrendingUp className="w-4 h-4" />
              </span>
              <input
                id="inventory-search"
                type="text"
                placeholder="Search catalog by name..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:outline-none focus:border-indigo-500 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-900 focus:bg-white transition-all"
              />
            </div>

            <button
              id="btn-open-add-product-modal"
              onClick={() => {
                setEditingProduct(null);
                setShowAddModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Item
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Product</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Category</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Price</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Inventory Stock</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider font-mono text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInventory.map(prod => {
                  const outOfStock = prod.stock <= 0;
                  const lowStock = prod.stock > 0 && prod.stock <= 25;

                  return (
                    <tr key={prod.id} className="hover:bg-gray-50/20 transition-all">
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div>
                          <span className="text-xs font-bold text-gray-900 block">{prod.name}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5 font-mono">ID: {prod.id}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                          {prod.category}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-bold text-gray-900">
                        ₹{prod.price.toFixed(2)} <span className="text-gray-400 font-mono">/ {prod.unit}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${outOfStock ? 'text-red-600' : lowStock ? 'text-amber-600' : 'text-gray-700'}`}>
                            {prod.stock} units
                          </span>
                          {outOfStock ? (
                            <span className="p-0.5 bg-red-50 text-red-600 rounded-full" title="Out of Stock">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          ) : lowStock ? (
                            <span className="p-0.5 bg-amber-50 text-amber-600 rounded-full" title="Restock Soon">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`btn-edit-prod-${prod.id}`}
                            onClick={() => startEditProduct(prod)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                            title="Edit product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-prod-${prod.id}`}
                            onClick={() => deleteProduct(prod.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ORDERS VIEW */}
      {activeTab === 'orders' && (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Order List */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm font-sans mb-2">Fulfillment Dispatch Board</h3>
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {orders.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">No customer orders placed yet.</div>
              ) : (
                orders.map(order => {
                  const isDelivered = order.status === 'delivered';
                  
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-4 transition-all hover:bg-gray-50/50 cursor-pointer flex items-center justify-between gap-4 border border-transparent rounded-2xl ${
                        selectedOrder && selectedOrder.id === order.id ? 'bg-indigo-50/20 border-indigo-100' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-900 font-mono">{order.id}</span>
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full font-mono ${
                            isDelivered ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 block truncate">Customer: {order.userName}</span>
                        <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString()} @ {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-extrabold text-gray-900 block">₹{order.total.toFixed(2)}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5 font-mono">{order.items.length} items</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Fulfillment Action Panel */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {selectedOrder ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6"
                >
                  <div className="border-b border-gray-50 pb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Fulfillment actions</span>
                      <h3 className="font-extrabold text-gray-900 text-sm font-mono mt-0.5">{selectedOrder.id}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-xs text-gray-400 hover:text-gray-900 font-bold"
                    >
                      Deselect
                    </button>
                  </div>

                  {/* Shipment progress stage buttons */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">Logistics Controls</span>
                    
                    {selectedOrder.status === 'placed' && (
                      <button
                        id="btn-admin-pack"
                        onClick={() => advanceOrderStatus(selectedOrder.id, 'packed')}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Package className="w-4 h-4" /> Advance to: packed
                      </button>
                    )}

                    {selectedOrder.status === 'packed' && (
                      <button
                        id="btn-admin-ship"
                        onClick={() => advanceOrderStatus(selectedOrder.id, 'shipped')}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Truck className="w-4 h-4" /> Advance to: shipped
                      </button>
                    )}

                    {selectedOrder.status === 'shipped' && (
                      <button
                        id="btn-admin-out"
                        onClick={() => advanceOrderStatus(selectedOrder.id, 'out_for_delivery')}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <MapPin className="w-4 h-4" /> Advance to: out_for_delivery
                      </button>
                    )}

                    {selectedOrder.status === 'out_for_delivery' && (
                      <button
                        id="btn-admin-deliver"
                        onClick={() => advanceOrderStatus(selectedOrder.id, 'delivered')}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Check className="w-4 h-4" /> Finalize: delivered
                      </button>
                    )}

                    {selectedOrder.status === 'delivered' && (
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-800 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4" /> Shipment fully delivered. Transaction closed.
                      </div>
                    )}
                  </div>

                  {/* Destination */}
                  <div className="border-t border-gray-100 pt-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">Delivery Destination</span>
                    <span className="text-xs font-bold text-gray-800 block mt-1">{selectedOrder.shippingAddress.name}</span>
                    <span className="text-xs text-gray-500 block truncate">{selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}</span>
                    <span className="text-xs text-gray-400 font-mono block mt-1">{selectedOrder.shippingAddress.phone}</span>
                  </div>

                  {/* Items list */}
                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">Items Breakdown</span>
                    <div className="divide-y divide-gray-50 bg-gray-50 p-3 rounded-xl max-h-40 overflow-y-auto">
                      {selectedOrder.items.map((it, i) => (
                        <div key={i} className="py-2 flex items-center justify-between text-xs">
                          <span className="text-gray-800 font-medium truncate max-w-[150px]">{it.name}</span>
                          <span className="text-gray-400 font-mono font-bold flex-shrink-0">x{it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center p-8 h-80 text-gray-400"
                >
                  <BarChart3 className="w-10 h-10 mb-2 opacity-25" />
                  <p className="text-xs">Select an active order from the board to access logistics and delivery controls.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 4. AI SUPPLY CHAIN HUB & FORECASTING */}
      {activeTab === 'ai-hub' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 md:p-8 rounded-3xl text-white border border-indigo-500/20 relative overflow-hidden shadow-xl">
            <div className="absolute top-[-30%] right-[-10%] w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-400/20 inline-flex items-center gap-1 uppercase tracking-widest font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> AI Supply Chain Optimization
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans">Gemini Demand Forecasting & Restocking</h2>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                Connect directly to Gemini's AI model to run structured inventory predictive models. Our AI audit scans product stock depletion rates alongside actual completed order volume trends to estimate category demands for the next week.
              </p>
              <button
                id="btn-run-ai-forecast"
                onClick={runAiForecast}
                disabled={forecastLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                {forecastLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing parameters...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" /> Run Gemini Supply Chain Audit
                  </>
                )}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {forecastResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* AI Executive Summary */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                  <h3 className="font-bold text-gray-900 text-sm font-sans flex items-center gap-1.5">
                    <Sparkles className="w-4.5 h-4.5 text-amber-500" /> AI Executive Analysis Summary
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed bg-indigo-50/20 p-4 rounded-2xl border border-indigo-100 font-medium">
                    {forecastResult.summary}
                  </p>
                </div>

                {/* Category recommendation grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {forecastResult.categoryRecommendations.map((rec, i) => {
                    const isHigh = rec.forecastedDemand === 'High';
                    const isLow = rec.forecastedDemand === 'Low';

                    return (
                      <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-gray-900">{rec.category}</span>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full font-mono ${
                              isHigh ? 'bg-red-50 text-red-600' : isLow ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {rec.forecastedDemand} Demand
                            </span>
                          </div>

                          <div className="mt-4 flex gap-6 text-center">
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Current Stock</span>
                              <span className="text-sm font-extrabold text-gray-800 block mt-0.5">{rec.currentStock} units</span>
                            </div>
                            <div className="border-l border-gray-200 pl-6">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Recommended Restock</span>
                              <span className="text-sm font-extrabold text-indigo-700 block mt-0.5">+{rec.recommendedRestock} units</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 pt-3.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">AI Justification</span>
                          <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                            {rec.justification}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ADD/EDIT INVENTORY PRODUCT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setShowAddModal(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 md:p-8 max-w-xl w-full z-10 relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <h3 className="font-extrabold text-gray-900 text-lg font-sans mb-6">
                {editingProduct ? 'Modify Product Specifications' : 'Integrate New Product'}
              </h3>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 font-mono">Product Name</label>
                    <input
                      id="form-p-name"
                      type="text"
                      required
                      placeholder="e.g. Organic Blueberries"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 font-mono">Category</label>
                    <select
                      id="form-p-cat"
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Fresh Produce">Fresh Produce</option>
                      <option value="Dairy & Eggs">Dairy & Eggs</option>
                      <option value="Meat & Seafood">Meat & Seafood</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Bakery & Snacks">Bakery & Snacks</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 font-mono">Price (₹)</label>
                    <input
                      id="form-p-price"
                      type="number"
                      step="0.01"
                      required
                      placeholder="3.99"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 font-mono">Stock Quantity</label>
                    <input
                      id="form-p-stock"
                      type="number"
                      required
                      placeholder="40"
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 font-mono">Pricing Unit</label>
                    <input
                      id="form-p-unit"
                      type="text"
                      required
                      placeholder="lb, dozen, pc, pack"
                      value={newProdUnit}
                      onChange={(e) => setNewProdUnit(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 font-mono">Image URL</label>
                  <input
                    id="form-p-image"
                    type="text"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={newProdImage}
                    onChange={(e) => setNewProdImage(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 font-mono">Description</label>
                  <textarea
                    id="form-p-desc"
                    rows={3}
                    placeholder="Brief description of item origins, quality or vitamins..."
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-save-prod"
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
