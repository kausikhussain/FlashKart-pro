import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, ShoppingCart, User as UserIcon, LogOut, Check,
  CreditCard, MapPin, Phone, Shield, Sparkles, Trash2, X, AlertCircle, Plus,
  QrCode, Smartphone, RefreshCw
} from 'lucide-react';
import { User, Product, CartItem, Order } from './types';
import LoginScreen from './components/LoginScreen';
import RoleSwitcher from './components/RoleSwitcher';
import NotificationCenter from './components/NotificationCenter';
import ShopView from './components/ShopView';
import RecipeAssistant from './components/RecipeAssistant';
import PersonalShopper from './components/PersonalShopper';
import OrderTracker from './components/OrderTracker';
import AdminPanel from './components/AdminPanel';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notificationsTrigger, setNotificationsTrigger] = useState(0);

  // Customer Navigation
  const [activeTab, setActiveTab] = useState<'shop' | 'recipe' | 'personal-shopper' | 'orders'>('shop');
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);

  // Cart / Checkout Drawer State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCouponName, setAppliedCouponName] = useState('');

  // Checkout Form
  const [shippingName, setShippingName] = useState('');
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingZip, setShippingZip] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');

  // Indian Payment System State
  const [paymentMode, setPaymentMode] = useState<'upi' | 'card'>('upi');
  const [upiApp, setUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim'>('gpay');
  const [upiMethod, setUpiMethod] = useState<'id' | 'qr'>('id');
  const [upiId, setUpiId] = useState('');
  const [isUpiVerified, setIsUpiVerified] = useState(false);
  const [upiVerificationLoading, setUpiVerificationLoading] = useState(false);
  const [qrTimer, setQrTimer] = useState(300); // 5 mins countdown

  // QR Code Timer effect
  useEffect(() => {
    let interval: any;
    if (isCartOpen && paymentMode === 'upi' && upiMethod === 'qr') {
      setQrTimer(300);
      interval = setInterval(() => {
        setQrTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCartOpen, paymentMode, upiMethod]);

  // Format QR countdown
  const formatQrTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pre-seed UPI ID when phone changes or is loaded
  useEffect(() => {
    if (shippingPhone) {
      const cleanPhone = shippingPhone.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        const handleSuffix = upiApp === 'gpay' ? 'okaxis' : upiApp === 'phonepe' ? 'ybl' : upiApp === 'paytm' ? 'paytm' : 'upi';
        setUpiId(`${cleanPhone}@${handleSuffix}`);
      }
    }
  }, [shippingPhone, upiApp]);

  // Reset UPI verification on change
  useEffect(() => {
    setIsUpiVerified(false);
  }, [upiId, upiApp, upiMethod]);

  const handleVerifyUpi = () => {
    if (!upiId || !upiId.includes('@')) {
      alert("Please enter a valid UPI ID / Virtual Payment Address (e.g. mobile@upi or name@okaxis)");
      return;
    }
    setUpiVerificationLoading(true);
    setTimeout(() => {
      setUpiVerificationLoading(false);
      setIsUpiVerified(true);
    }, 1000);
  };

  // Payment Processing Simulation
  const [paymentStep, setPaymentStep] = useState<'idle' | 'processing' | 'success'>('idle');
  const [paymentStatusText, setPaymentStatusText] = useState('');

  // Fetch Products & Orders
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    if (!currentUser) return;
    try {
      const query = currentUser.role === 'admin' 
        ? '?role=admin' 
        : `?userId=${currentUser.id}`;
      const res = await fetch(`/api/orders${query}`);
      if (res.ok) {
        const data = await res.json();
        // Sort newest first
        setOrders(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchOrders();
    // Reset views if user role changes
    if (currentUser) {
      if (currentUser.role === 'admin') {
        setSelectedTrackingOrder(null);
      } else {
        // seed checkout defaults from name
        setShippingName(currentUser.name);
      }
    }
  }, [currentUser]);

  // Load cart from LocalStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem(`cart_${currentUser?.id || 'guest'}`);
    if (cached) {
      try {
        setCart(JSON.parse(cached));
      } catch (e) {
        setCart([]);
      }
    } else {
      setCart([]);
    }
  }, [currentUser]);

  // Save cart to LocalStorage
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem(`cart_${currentUser?.id || 'guest'}`, JSON.stringify(newCart));
  };

  // Switch role fast-track helper (for demo exploration)
  const handleSwitchRole = (targetRole: 'customer' | 'admin') => {
    const demoEmail = targetRole === 'admin' ? 'admin@freshkart.com' : 'customer@freshkart.com';
    const demoPassword = targetRole === 'admin' ? 'admin' : 'password';

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demoEmail, password: demoPassword })
    })
    .then(res => res.json())
    .then(data => {
      if (data.id) {
        setCurrentUser(data);
        setNotificationsTrigger(prev => prev + 1);
      }
    });
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    const existing = cart.find(i => i.product.id === product.id);
    if (existing) {
      const updated = cart.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      saveCart(updated);
    } else {
      saveCart([...cart, { product, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (product: Product) => {
    const updated = cart.filter(i => i.product.id !== product.id);
    saveCart(updated);
  };

  const handleUpdateQuantity = (product: Product, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(product);
      return;
    }
    const updated = cart.map(i => i.product.id === product.id ? { ...i, quantity } : i);
    saveCart(updated);
  };

  // Add multiple items (from AI recipe assistant matches)
  const handleAddMultipleToCart = (items: { product: Product; quantity: number }[]) => {
    let newCart = [...cart];
    items.forEach(({ product, quantity }) => {
      const existingIdx = newCart.findIndex(i => i.product.id === product.id);
      if (existingIdx !== -1) {
        newCart[existingIdx].quantity += quantity;
      } else {
        newCart.push({ product, quantity });
      }
    });
    saveCart(newCart);
  };

  // Calculate pricing numbers
  const cartSubtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const deliveryFee = cartSubtotal > 500 ? 0 : cartSubtotal > 0 ? 40 : 0;
  
  // Coupon processing
  const handleApplyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (code === 'FRESH10') {
      setAppliedDiscount(cartSubtotal * 0.1);
      setAppliedCouponName('FRESH10 (10% off)');
    } else if (code === 'SUPERKART') {
      if (cartSubtotal >= 500) {
        setAppliedDiscount(150.0);
        setAppliedCouponName('SUPERKART (₹150 off)');
      } else {
        alert("The coupon SUPERKART requires a minimum order of ₹500.00! Add more fresh goods to qualify.");
      }
    } else {
      alert("Invalid coupon code. Try using FRESH10 or SUPERKART!");
    }
    setCoupon('');
  };

  const finalTotal = Math.max(0, cartSubtotal - appliedDiscount + deliveryFee);

  // Submit secure checkout with dynamic multi-stage loading animation
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingName || !shippingStreet || !shippingCity || !shippingZip || !shippingPhone) {
      alert("Please complete all shipping address fields.");
      return;
    }

    if (paymentMode === 'card') {
      if (!cardNumber || !cardExpiry || !cardCVV) {
        alert("Please complete all credit card details.");
        return;
      }
    } else if (paymentMode === 'upi' && upiMethod === 'id') {
      if (!upiId) {
        alert("Please enter your UPI ID.");
        return;
      }
      if (!isUpiVerified) {
        alert("Please verify your UPI ID/VPA first before placing the order.");
        return;
      }
    }

    setPaymentStep('processing');
    
    // Simulate real NPCI / bank checking layers based on selected Indian Payment Method
    let steps: string[] = [];
    let methodText = "";

    if (paymentMode === 'upi') {
      const appName = upiApp === 'gpay' ? 'Google Pay' : upiApp === 'phonepe' ? 'PhonePe' : upiApp === 'paytm' ? 'Paytm' : 'BHIM';
      if (upiMethod === 'id') {
        methodText = `${appName} (UPI ID: ${upiId})`;
        steps = [
          `Initializing secure handshakes with NPCI and ${appName}...`,
          `Pinging UPI Provider gateway...`,
          `Sending collection request of ₹${finalTotal.toFixed(2)} to ${upiId}...`,
          `Awaiting your payment authorization in your ${appName} mobile app...`,
          "UPI Secure Pin authenticated! Capturing funds...",
          "NPCI Transaction completed successfully. Order finalized!"
        ];
      } else {
        methodText = `${appName} (UPI QR Code Scan)`;
        steps = [
          "Verifying scanned QR Token with NPCI secure networks...",
          "Validating secure multi-bank gateway settlement...",
          `UPI payment authorized for ₹${finalTotal.toFixed(2)}...`,
          "Payment captured successfully!",
          "Finalizing order invoices..."
        ];
      }
    } else {
      methodText = `RuPay Card ending in ${cardNumber.slice(-4)}`;
      steps = [
        "Contacting secure banking hub...",
        "Validating credit/debit card credentials...",
        "Performing 3D-Secure transaction security checks...",
        "Awaiting secure One-Time Password (OTP) verification...",
        "OTP verified! Authorization settlement completed...",
        "Finalizing order invoices..."
      ];
    }

    for (let i = 0; i < steps.length; i++) {
      setPaymentStatusText(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Submit order payload to Express database
    try {
      const payload = {
        userId: currentUser?.id,
        userName: currentUser?.name,
        items: cart.map(i => ({
          productId: i.product.id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          imageUrl: i.product.imageUrl,
          category: i.product.category
        })),
        subtotal: cartSubtotal,
        discount: appliedDiscount,
        deliveryFee,
        total: finalTotal,
        shippingAddress: {
          name: shippingName,
          street: shippingStreet,
          city: shippingCity,
          zipCode: shippingZip,
          phone: shippingPhone
        },
        paymentMethod: methodText
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setPaymentStep('success');
        saveCart([]); // clear cart
        setAppliedDiscount(0);
        setAppliedCouponName('');
        setNotificationsTrigger(prev => prev + 1);
        fetchProducts(); // refresh products stock levels
        fetchOrders(); // update historical items
      } else {
        throw new Error("Checkout registration failed server-side");
      }
    } catch (err) {
      alert("Checkout failed. Please review values and try again.");
      setPaymentStep('idle');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]);
  };

  return (
    <div id="app-viewport-container" className="min-h-screen bg-slate-50 font-sans text-gray-800 flex flex-col justify-between">
      
      {/* Floating identity role selector */}
      <RoleSwitcher currentUser={currentUser} onSwitchRole={handleSwitchRole} />

      {!currentUser ? (
        <LoginScreen onLoginSuccess={setCurrentUser} />
      ) : (
        <>
          {/* Main Navigation Bar */}
          <header id="app-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
              
              {/* Left: Brand Logo */}
              <div className="flex items-center gap-6">
                <div
                  onClick={() => {
                    if (currentUser.role === 'customer') {
                      setActiveTab('shop');
                      setSelectedTrackingOrder(null);
                    }
                  }}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-600/10 group-hover:scale-102 transition-transform">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-black text-gray-900 tracking-tight">
                    Fresh Kart <span className="text-indigo-500 font-normal">🌿</span>
                  </span>
                </div>

                {/* Navigation Links for Customer */}
                {currentUser.role === 'customer' && (
                  <nav className="hidden md:flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-150">
                    {[
                      { id: 'shop', label: 'Produce Catalog' },
                      { id: 'recipe', label: 'AI Recipes' },
                      { id: 'personal-shopper', label: 'Personal AI Shopper ✨' },
                      { id: 'orders', label: 'Fulfillment & History' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        id={`btn-nav-${tab.id}`}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          setSelectedTrackingOrder(null);
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeTab === tab.id && !selectedTrackingOrder
                            ? 'bg-white text-indigo-800 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                )}
              </div>

              {/* Right: Notification center, Profile & Shopping Cart */}
              <div className="flex items-center gap-3">
                
                <NotificationCenter userId={currentUser.id} refreshTrigger={notificationsTrigger} />

                {currentUser.role === 'customer' && (
                  <button
                    id="btn-open-cart"
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-2 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer"
                  >
                    <ShoppingCart className="w-5.5 h-5.5" />
                    {cart.length > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center border border-white">
                        {cart.reduce((sum, i) => sum + i.quantity, 0)}
                      </span>
                    )}
                  </button>
                )}

                {/* Profile Widget */}
                <div className="h-9 border-l border-gray-200/60 mx-1.5 hidden sm:block" />

                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center text-slate-700">
                    <UserIcon className="w-4.5 h-4.5" />
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-extrabold text-gray-900 line-clamp-1">{currentUser.name}</span>
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono font-bold flex items-center gap-1">
                      {currentUser.role === 'admin' ? (
                        <>
                          <Shield className="w-2.5 h-2.5 text-indigo-600" /> Admin Controller
                        </>
                      ) : (
                        "Customer Account"
                      )}
                    </span>
                  </div>
                  <button
                    id="btn-logout"
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50/50 transition-all cursor-pointer"
                    title="Log Out of system"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>

              </div>
            </div>
          </header>

          {/* Main body content stage */}
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <AnimatePresence mode="wait">
              {currentUser.role === 'admin' ? (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AdminPanel
                    products={products}
                    orders={orders}
                    onRefreshProducts={fetchProducts}
                    onRefreshOrders={fetchOrders}
                  />
                </motion.div>
              ) : selectedTrackingOrder ? (
                <motion.div
                  key="tracker"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <OrderTracker
                    order={selectedTrackingOrder}
                    onClose={() => {
                      setSelectedTrackingOrder(null);
                      setActiveTab('orders');
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'shop' && (
                    <ShopView
                      products={products}
                      cart={cart}
                      onAddToCart={handleAddToCart}
                      onRemoveFromCart={handleRemoveFromCart}
                      onUpdateQuantity={handleUpdateQuantity}
                    />
                  )}

                  {activeTab === 'recipe' && (
                    <RecipeAssistant onAddMultipleToCart={handleAddMultipleToCart} />
                  )}

                  {activeTab === 'personal-shopper' && (
                    <PersonalShopper
                      userId={currentUser.id}
                      cart={cart}
                      onAddToCart={handleAddToCart}
                      refreshTrigger={notificationsTrigger}
                    />
                  )}

                  {activeTab === 'orders' && (
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                      <div>
                        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight font-sans">Fulfillment logs & Orders History</h2>
                        <p className="text-xs text-gray-500 mt-1">Review active shipments, track transit milestones, and re-order family favorites.</p>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {orders.length === 0 ? (
                          <div className="py-16 text-center text-gray-400">
                            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-25" />
                            <h4 className="font-semibold text-sm">No grocery history yet</h4>
                            <p className="text-xs max-w-sm mx-auto leading-relaxed mt-1">
                              Ready to eat organic? Start checking out premium ingredients and trigger active delivery pipelines!
                            </p>
                          </div>
                        ) : (
                          orders.map(order => (
                            <div key={order.id} className="py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 first:pt-0 last:pb-0">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-xs font-bold text-gray-800 font-mono">{order.id}</span>
                                  <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full font-mono ${
                                    order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {order.status}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500 block truncate leading-relaxed">
                                  {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono block mt-1">
                                  Ordered {new Date(order.createdAt).toLocaleDateString()} @ {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-left md:text-right">
                                  <span className="text-sm font-extrabold text-gray-900 block">${order.total.toFixed(2)}</span>
                                  <span className="text-[10px] text-gray-400 block font-mono">Paid via {order.paymentMethod}</span>
                                </div>
                                <button
                                  id={`btn-track-order-${order.id}`}
                                  onClick={() => setSelectedTrackingOrder(order)}
                                  className="bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-800 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  Track Order
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Secure Client Shopping Cart Drawer */}
          <AnimatePresence>
            {isCartOpen && (
              <div className="fixed inset-0 z-50 overflow-hidden">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity" onClick={() => setIsCartOpen(false)} />

                <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-150 flex items-center justify-between bg-indigo-50/10">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-indigo-700" />
                        <h2 className="text-base font-extrabold text-gray-900 font-sans">Your Fresh Basket</h2>
                      </div>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Cart Items Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {cart.length === 0 ? (
                        <div className="py-20 text-center text-gray-400">
                          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <h4 className="font-bold text-sm text-gray-600">Your basket is empty</h4>
                          <p className="text-xs max-w-xs mx-auto mt-1 leading-relaxed">Fill it with fresh, organic vegetables, cuts of steak, cold-brews and bakery items today!</p>
                        </div>
                      ) : (
                        <div className="space-y-4 divide-y divide-gray-100">
                          {cart.map((item, idx) => (
                            <div key={item.product.id} className={`flex gap-4 items-center ${idx > 0 ? 'pt-4' : ''}`}>
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-gray-900 truncate">{item.product.name}</h4>
                                <span className="text-[10px] text-gray-400 font-mono block mt-0.5">₹{item.product.price.toFixed(2)} / {item.product.unit}</span>
                                
                                {/* +/- counter */}
                                <div className="flex items-center gap-2 mt-2 bg-gray-50 border border-gray-150 rounded-lg p-0.5 w-fit">
                                  <button
                                    onClick={() => handleUpdateQuantity(item.product, item.quantity - 1)}
                                    className="p-1 hover:bg-gray-200 rounded text-gray-500 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </button>
                                  <span className="text-xs font-bold text-gray-800 w-4 text-center">{item.quantity}</span>
                                  <button
                                    disabled={item.quantity >= item.product.stock}
                                    onClick={() => handleUpdateQuantity(item.product, item.quantity + 1)}
                                    className="p-1 hover:bg-gray-200 rounded text-gray-500 cursor-pointer disabled:opacity-20"
                                  >
                                    <Plus className="w-3 h-3 text-indigo-700" />
                                  </button>
                                </div>
                              </div>
                              <span className="text-xs font-extrabold text-gray-900 flex-shrink-0">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Checkout & Bill Area */}
                    {cart.length > 0 && (
                      <div className="border-t border-gray-150 p-6 space-y-4 bg-gray-50/50">
                        {/* Coupon entry */}
                        <div className="flex gap-2">
                          <input
                            id="checkout-coupon"
                            type="text"
                            placeholder="Coupon (FRESH10, SUPERKART)"
                            value={coupon}
                            onChange={(e) => setCoupon(e.target.value)}
                            className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs uppercase focus:outline-none focus:border-indigo-500 font-mono"
                          />
                          <button
                            id="btn-apply-coupon"
                            onClick={handleApplyCoupon}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>

                        {appliedCouponName && (
                          <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-xl text-xs text-indigo-800 font-semibold">
                            <span>Discount active: {appliedCouponName}</span>
                            <button
                              onClick={() => {
                                setAppliedDiscount(0);
                                setAppliedCouponName('');
                              }}
                              className="text-indigo-700 font-bold hover:text-red-500"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        {/* Order calculation fields */}
                        <div className="space-y-1.5 text-xs font-semibold text-gray-500 border-b border-gray-250/50 pb-3">
                          <div className="flex justify-between">
                            <span>Basket Subtotal</span>
                            <span className="text-gray-900">₹{cartSubtotal.toFixed(2)}</span>
                          </div>
                          {appliedDiscount > 0 && (
                            <div className="flex justify-between text-red-500">
                              <span>Coupon Savings</span>
                              <span>-₹{appliedDiscount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Delivery logistics fee</span>
                            <span className="text-gray-900">
                              {deliveryFee === 0 ? "FREE" : `₹${deliveryFee.toFixed(2)}`}
                            </span>
                          </div>
                          {deliveryFee > 0 && (
                            <span className="text-[10px] text-gray-400 block font-normal">Add ₹{(500 - cartSubtotal).toFixed(2)} more for free premium delivery!</span>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-sm font-bold text-gray-900 pt-1">
                          <span>Total to Pay:</span>
                          <span className="text-base font-black text-indigo-700">₹{finalTotal.toFixed(2)}</span>
                        </div>

                        {/* Expanded checkout forms */}
                        <form onSubmit={handleCheckoutSubmit} className="space-y-3.5 pt-4 border-t border-gray-150">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">Logistics & Payment</span>
                          
                          <div className="space-y-2">
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <UserIcon className="w-3.5 h-3.5" />
                              </span>
                              <input
                                id="checkout-name"
                                type="text"
                                required
                                placeholder="Recipient Full Name"
                                value={shippingName}
                                onChange={(e) => setShippingName(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <MapPin className="w-3.5 h-3.5" />
                              </span>
                              <input
                                id="checkout-street"
                                type="text"
                                required
                                placeholder="Shipping Street Address"
                                value={shippingStreet}
                                onChange={(e) => setShippingStreet(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <input
                                id="checkout-city"
                                type="text"
                                required
                                placeholder="City"
                                value={shippingCity}
                                onChange={(e) => setShippingCity(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
                              />
                              <input
                                id="checkout-zip"
                                type="text"
                                required
                                placeholder="ZIP Code"
                                value={shippingZip}
                                onChange={(e) => setShippingZip(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 font-mono"
                              />
                            </div>

                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <Phone className="w-3.5 h-3.5" />
                              </span>
                              <input
                                id="checkout-phone"
                                type="text"
                                required
                                placeholder="Contact Phone Number"
                                value={shippingPhone}
                                onChange={(e) => setShippingPhone(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 font-mono"
                              />
                            </div>
                          </div>

                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block pt-1">Payment Method (NPCI Secure Gateway)</span>

                          {/* Payment Mode Selector Tabs */}
                          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                            <button
                              id="btn-pay-upi"
                              type="button"
                              onClick={() => setPaymentMode('upi')}
                              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                paymentMode === 'upi'
                                  ? 'bg-white text-indigo-700 shadow-sm'
                                  : 'text-gray-500 hover:text-gray-900'
                              }`}
                            >
                              <Smartphone className="w-3.5 h-3.5" /> UPI Apps & QR
                            </button>
                            <button
                              id="btn-pay-card"
                              type="button"
                              onClick={() => setPaymentMode('card')}
                              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                paymentMode === 'card'
                                  ? 'bg-white text-indigo-700 shadow-sm'
                                  : 'text-gray-500 hover:text-gray-900'
                              }`}
                            >
                              <CreditCard className="w-3.5 h-3.5" /> RuPay / Cards
                            </button>
                          </div>

                          {/* UPI Options */}
                          {paymentMode === 'upi' && (
                            <div className="space-y-3.5 animate-fade-in">
                              {/* 1. Popular Indian UPI Apps Grid */}
                              <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono block mb-2">Select UPI App</span>
                                <div className="grid grid-cols-4 gap-2">
                                  {[
                                    { key: 'gpay', label: 'Google Pay', color: 'border-blue-500 hover:bg-blue-50/50', activeColor: 'bg-blue-50 text-blue-700 border-blue-500' },
                                    { key: 'phonepe', label: 'PhonePe', color: 'border-purple-500 hover:bg-purple-50/50', activeColor: 'bg-purple-50 text-purple-700 border-purple-500' },
                                    { key: 'paytm', label: 'Paytm', color: 'border-sky-500 hover:bg-sky-50/50', activeColor: 'bg-sky-50 text-sky-700 border-sky-500' },
                                    { key: 'bhim', label: 'BHIM UPI', color: 'border-emerald-500 hover:bg-emerald-50/50', activeColor: 'bg-emerald-50 text-emerald-700 border-emerald-500' }
                                  ].map((app) => (
                                    <button
                                      key={app.key}
                                      type="button"
                                      onClick={() => setUpiApp(app.key as any)}
                                      className={`border text-[10px] font-bold p-2 rounded-xl text-center cursor-pointer transition-all ${
                                        upiApp === app.key
                                          ? app.activeColor
                                          : 'border-gray-200 text-gray-600 bg-white'
                                      }`}
                                    >
                                      {app.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* 2. UPI Flow Selector (ID or QR) */}
                              <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                                <button
                                  type="button"
                                  onClick={() => setUpiMethod('id')}
                                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                    upiMethod === 'id'
                                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                      : 'bg-white border-gray-150 text-gray-500 hover:text-gray-800'
                                  }`}
                                >
                                  UPI ID (VPA)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setUpiMethod('qr')}
                                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                    upiMethod === 'qr'
                                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                      : 'bg-white border-gray-150 text-gray-500 hover:text-gray-800'
                                  }`}
                                >
                                  Scan QR Code
                                </button>
                              </div>

                              {/* 3. VPA ID Field */}
                              {upiMethod === 'id' && (
                                <div className="space-y-2 pt-1">
                                  <div className="flex gap-2 items-center">
                                    <div className="relative flex-1">
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                        <Smartphone className="w-3.5 h-3.5" />
                                      </span>
                                      <input
                                        id="checkout-upi-id"
                                        type="text"
                                        required={upiMethod === 'id'}
                                        placeholder="mobile@okaxis or username@upi"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 font-mono"
                                      />
                                    </div>
                                    <button
                                      id="btn-verify-upi"
                                      type="button"
                                      onClick={handleVerifyUpi}
                                      disabled={upiVerificationLoading || !upiId}
                                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 text-white disabled:text-gray-400 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer font-mono font-bold"
                                    >
                                      {upiVerificationLoading ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : isUpiVerified ? (
                                        "Verified"
                                      ) : (
                                        "Verify"
                                      )}
                                    </button>
                                  </div>
                                  
                                  {isUpiVerified ? (
                                    <span className="text-[10px] text-emerald-600 font-semibold block bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      NPCI Verified VPA: <strong className="font-bold">{shippingName || "Customer S."}</strong>
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-gray-400 block leading-tight">
                                      UPI Address must be verified with NPCI registry before processing.
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* 4. QR Code Box */}
                              {upiMethod === 'qr' && (
                                <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 text-center space-y-3">
                                  {/* Ticking Timer Countdown */}
                                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                                    <span>Dynamic UPI QR Code</span>
                                    {qrTimer > 0 ? (
                                      <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 animate-pulse">
                                        Expires in: {formatQrTime(qrTimer)}
                                      </span>
                                    ) : (
                                      <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 font-extrabold">
                                        Expired
                                      </span>
                                    )}
                                  </div>

                                  {/* Elegant Inline SVG QR Code */}
                                  {qrTimer > 0 ? (
                                    <div className="relative inline-block">
                                      <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                                        <rect x="5" y="5" width="22" height="22" fill="#1e1b4b" stroke="#312e81" strokeWidth="1.5" />
                                        <rect x="9" y="9" width="14" height="14" fill="#4f46e5" />
                                        
                                        <rect x="73" y="5" width="22" height="22" fill="#1e1b4b" stroke="#312e81" strokeWidth="1.5" />
                                        <rect x="77" y="9" width="14" height="14" fill="#4f46e5" />
                                        
                                        <rect x="5" y="73" width="22" height="22" fill="#1e1b4b" stroke="#312e81" strokeWidth="1.5" />
                                        <rect x="9" y="77" width="14" height="14" fill="#4f46e5" />

                                        <rect x="42" y="42" width="16" height="16" fill="#4f46e5" rx="3" />
                                        <text x="50" y="53" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">₹</text>

                                        <rect x="33" y="5" width="6" height="6" fill="#312e81" />
                                        <rect x="45" y="15" width="8" height="4" fill="#4f46e5" />
                                        <rect x="58" y="8" width="4" height="10" fill="#312e81" />
                                        
                                        <rect x="5" y="33" width="10" height="6" fill="#4f46e5" />
                                        <rect x="20" y="45" width="12" height="4" fill="#312e81" />
                                        <rect x="15" y="55" width="6" height="10" fill="#4f46e5" />

                                        <rect x="73" y="33" width="6" height="12" fill="#312e81" />
                                        <rect x="85" y="45" width="10" height="4" fill="#4f46e5" />
                                        <rect x="77" y="55" width="8" height="8" fill="#312e81" />

                                        <rect x="33" y="73" width="12" height="6" fill="#4f46e5" />
                                        <rect x="55" y="83" width="8" height="10" fill="#312e81" />
                                        <rect x="42" y="88" width="24" height="4" fill="#4f46e5" />
                                        
                                        <rect x="73" y="73" width="12" height="12" fill="#312e81" />
                                        <rect x="85" y="85" width="10" height="10" fill="#4f46e5" />
                                      </svg>
                                    </div>
                                  ) : (
                                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded-xl flex flex-col justify-center items-center text-gray-400 gap-1 border border-dashed border-gray-300">
                                      <RefreshCw className="w-5 h-5 text-gray-400" />
                                      <button
                                        type="button"
                                        onClick={() => setQrTimer(300)}
                                        className="text-[9px] font-bold text-indigo-600 hover:underline"
                                      >
                                        Regenerate QR
                                      </button>
                                    </div>
                                  )}

                                  <div className="space-y-1">
                                    <p className="text-[10px] text-gray-500 font-medium">Scan using Google Pay, PhonePe, Paytm, or BHIM apps.</p>
                                    <button
                                      type="button"
                                      onClick={() => setIsUpiVerified(true)}
                                      className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all ${
                                        isUpiVerified
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                                      }`}
                                    >
                                      {isUpiVerified ? "✓ Simulated Mobile Scan Approved!" : "Simulate UPI Mobile Scan & Pay"}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* RuPay/Card Options */}
                          {paymentMode === 'card' && (
                            <div className="space-y-2 animate-fade-in">
                              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider font-mono block pt-1 bg-indigo-50/50 p-2 border border-indigo-100/50 rounded-xl">RuPay Security Routing Active</span>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 font-bold">
                                  <CreditCard className="w-3.5 h-3.5" />
                                </span>
                                <input
                                  id="checkout-card"
                                  type="text"
                                  required={paymentMode === 'card'}
                                  maxLength={16}
                                  placeholder="RuPay / Credit Card Number"
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                                  className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 font-mono"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  id="checkout-expiry"
                                  type="text"
                                  required={paymentMode === 'card'}
                                  maxLength={5}
                                  placeholder="MM/YY"
                                  value={cardExpiry}
                                  onChange={(e) => setCardExpiry(e.target.value)}
                                  className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 font-mono"
                                />
                                <input
                                  id="checkout-cvv"
                                  type="password"
                                  required={paymentMode === 'card'}
                                  maxLength={3}
                                  placeholder="CVV"
                                  value={cardCVV}
                                  onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, ''))}
                                  className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 font-mono"
                                />
                              </div>
                            </div>
                          )}

                          <button
                            id="btn-submit-payment"
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 transition-all mt-3 font-mono uppercase"
                          >
                            {paymentMode === 'upi' ? (
                              upiMethod === 'qr' ? (
                                <QrCode className="w-4 h-4" />
                              ) : (
                                <Smartphone className="w-4 h-4" />
                              )
                            ) : (
                              <CreditCard className="w-4 h-4" />
                            )}
                            {paymentMode === 'upi'
                              ? upiMethod === 'qr'
                                ? "Proceed with UPI QR Settlement"
                                : "Verify & Place UPI App Order"
                              : "Pay securely via RuPay Gateway"}
                          </button>
                        </form>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Checkout secure payment process modal simulator overlay */}
          <AnimatePresence>
            {paymentStep !== 'idle' && (
              <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white p-6">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="max-w-md w-full text-center space-y-6"
                >
                  {paymentStep === 'processing' ? (
                    <>
                      <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10" />
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                      </div>
                      <h3 className="text-lg font-bold font-sans">Fresh Kart Banking Gateway</h3>
                      <p className="text-xs text-indigo-400 font-mono animate-pulse">{paymentStatusText}</p>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 10 }}
                        className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/20"
                      >
                        <Check className="w-8 h-8 stroke-[3]" />
                      </motion.div>
                      <h3 className="text-xl font-black font-sans text-indigo-400">Payment Secured! 🎉</h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                        Your transaction was fully authorized and logged. Your groceries have been entered into the active fulfillment queue.
                      </p>
                      <button
                        id="btn-payment-done"
                        onClick={() => {
                          setPaymentStep('idle');
                          setIsCartOpen(false);
                          setActiveTab('orders'); // navigate to tracking history
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs tracking-tight shadow-md transition-colors cursor-pointer"
                      >
                        Track Shipment Status
                      </button>
                    </>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Footer branding details */}
          <footer className="bg-white border-t border-gray-100 py-6 mt-12 text-center text-xs text-gray-400 font-medium">
            <p>Fresh Kart 🌿 — Ultra-Fresh Grocery Logistics & Supply Optimization. Powered by Gemini AI.</p>
          </footer>
        </>
      )}
    </div>
  );
}
