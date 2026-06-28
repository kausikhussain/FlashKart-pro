import React from 'react';
import { Package, Truck, Home, ShoppingBag, ArrowRight, MapPin, Calendar, Clock, User } from 'lucide-react';
import { Order } from '../types';
import { motion } from 'motion/react';

interface OrderTrackerProps {
  order: Order;
  onClose: () => void;
}

export default function OrderTracker({ order, onClose }: OrderTrackerProps) {
  const stages: { key: Order['status']; title: string; desc: string; icon: any }[] = [
    { key: 'placed', title: 'Order Placed', desc: 'Secure payment confirmed', icon: ShoppingBag },
    { key: 'packed', title: 'Assembled & Packed', desc: 'Insulated with thermal wraps', icon: Package },
    { key: 'shipped', title: 'In Transit', desc: 'Dispatched from distribution', icon: Truck },
    { key: 'out_for_delivery', title: 'Out For Delivery', desc: 'Courier route is active', icon: MapPin },
    { key: 'delivered', title: 'Delivered', desc: 'Enjoy your fresh food!', icon: Home }
  ];

  const currentStageIndex = stages.findIndex(s => s.key === order.status);

  // Dynamic courier description details for simulation
  const courierLogs: Record<string, { name: string; contact: string; coords: string; eta: string }> = {
    placed: { name: "Awaiting packaging", contact: "-", coords: "Warehouse Hub A", eta: "45-60 mins" },
    packed: { name: "Dispatch Manager Robert", contact: "Ext 821", coords: "Sorting Line 3", eta: "30-45 mins" },
    shipped: { name: "Transit Driver Mark", contact: "+1 (555) 293-8411", coords: "Highway Route 10", eta: "15-30 mins" },
    out_for_delivery: { name: "Rider John Doe", contact: "+1 (555) 302-9988", coords: "2.4 km away from destination", eta: "5-10 mins" },
    delivered: { name: "Rider John Doe", contact: "Completed", coords: "Delivered at Front Porch", eta: "Delivered" }
  };

  const activeLog = courierLogs[order.status] || courierLogs.placed;

  return (
    <div id="order-tracker-root" className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden max-w-4xl mx-auto">
      {/* Tracker Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-slate-900 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] bg-white/20 border border-white/15 text-white font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider block w-fit mb-2">
            Logistics Shipment Tracker
          </span>
          <h2 className="text-xl font-extrabold tracking-tight font-sans flex items-center gap-2">
            Tracking Code: <span className="font-mono bg-white/10 px-2.5 py-0.5 rounded text-lg">{order.id}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-indigo-100 font-semibold">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Ordered {new Date(order.createdAt).toLocaleDateString()}
            </span>
            <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full" />
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> ETA: {activeLog.eta}
            </span>
          </div>
        </div>

        <button
          id="btn-close-tracker"
          onClick={onClose}
          className="bg-white hover:bg-indigo-50 text-indigo-800 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-colors cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* Progress Timeline Stepper */}
        <div className="relative pt-4 pb-8 border-b border-gray-100">
          {/* Timeline bar base */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 hidden md:block" />
          
          {/* Active timeline bar */}
          {currentStageIndex > 0 && (
            <div
              className="absolute top-1/2 left-0 h-1 bg-indigo-500 -translate-y-1/2 hidden md:block transition-all duration-500"
              style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
            />
          )}

          <div className="grid md:grid-cols-5 gap-6 md:gap-2 relative">
            {stages.map((stage, idx) => {
              const StageIcon = stage.icon;
              const isPast = idx <= currentStageIndex;
              const isActive = idx === currentStageIndex;

              return (
                <div key={stage.key} className="flex md:flex-col items-center gap-4 md:gap-3 text-left md:text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 flex-shrink-0 z-10 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-110 ring-4 ring-indigo-550'
                        : isPast
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-50 border border-gray-100 text-gray-400'
                    }`}
                  >
                    <StageIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className={`text-xs font-bold leading-tight ${isActive ? 'text-indigo-800 font-extrabold' : isPast ? 'text-gray-700' : 'text-gray-400'}`}>
                      {stage.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed truncate md:whitespace-normal">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Delivery Map Illustration & Logistics Note */}
        <div className="grid md:grid-cols-12 gap-6 items-stretch">
          {/* Interactive Route Map */}
          <div className="md:col-span-7 bg-slate-50 border border-gray-150 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden h-64 shadow-inner">
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
            
            {/* Mock Map Road Line */}
            <div className="absolute top-[40%] left-10 right-10 h-1 bg-slate-200 rounded-full" />
            <div className="absolute top-[40%] bottom-10 right-10 w-1 bg-slate-200 rounded-full" />

            {/* Hub node */}
            <div className="absolute top-[40%] left-10 w-3 h-3 bg-indigo-600 rounded-full -translate-x-1/2 -translate-y-1/2 border-4 border-indigo-100" />
            
            {/* Target home node */}
            <div className="absolute bottom-10 right-10 w-3 h-3 bg-red-600 rounded-full -translate-x-1/2 translate-y-1/2 border-4 border-red-100" />

            {/* Animated courier indicator */}
            {order.status !== 'delivered' && (
              <motion.div
                animate={{
                  x: order.status === 'placed' ? 20 : order.status === 'packed' ? 60 : order.status === 'shipped' ? 140 : 250,
                  y: order.status === 'out_for_delivery' ? 50 : 0
                }}
                transition={{ type: 'spring', stiffness: 50 }}
                className="absolute top-[40%] left-10 w-8 h-8 bg-indigo-600 border-2 border-white rounded-full flex items-center justify-center text-white shadow-md z-10"
              >
                <Truck className="w-4.5 h-4.5" />
              </motion.div>
            )}

            <div className="relative z-10 flex justify-between items-start">
              <span className="bg-white/90 backdrop-blur-sm shadow-sm text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-100">
                Delivery Route Map
              </span>
              <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                Active Live Radar
              </span>
            </div>

            <div className="relative z-10 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <Truck className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 font-mono block">LIVE COURIER RADAR</span>
                <span className="text-xs font-bold text-gray-800 block truncate">{activeLog.coords}</span>
              </div>
            </div>
          </div>

          {/* Logistics Courier Panel */}
          <div className="md:col-span-5 bg-gray-50 border border-gray-100 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono mb-4">Courier Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm">
                    {order.status === 'delivered' ? 'JD' : activeLog.name[0]}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">{order.status === 'delivered' ? 'Rider John Doe' : activeLog.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono block">{activeLog.contact}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200/60">
                  <span className="text-[10px] font-bold text-gray-400 font-mono uppercase block mb-1">Last Delivery Log</span>
                  <p className="text-xs text-gray-600 leading-relaxed italic bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    "{order.trackingHistory[order.trackingHistory.length - 1]?.note || "Awaiting logistics updates."}"
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200/60">
              <span className="text-[10px] font-bold text-gray-400 font-mono uppercase block mb-1">Shipping Destination</span>
              <span className="text-xs font-bold text-gray-800 block">{order.shippingAddress.name}</span>
              <span className="text-xs text-gray-500 block truncate mt-0.5">{order.shippingAddress.street}, {order.shippingAddress.city}</span>
            </div>
          </div>
        </div>

        {/* Order Item Summaries */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono mb-4">Items Shipped ({order.items.length})</h3>
          <div className="divide-y divide-gray-50 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 max-h-56 overflow-y-auto">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-gray-800 block truncate">{item.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{item.category}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-bold text-gray-700 block">Qty: {item.quantity}</span>
                  <span className="text-xs font-extrabold text-gray-900 block mt-0.5">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end gap-6 text-sm font-semibold border-t border-gray-100 pt-4 px-2">
            <div className="text-right text-gray-500">
              <span className="block text-xs">Subtotal:</span>
              <span className="block text-xs">Discount:</span>
              <span className="block text-xs">Delivery Fee:</span>
              <span className="block text-sm font-bold text-gray-900 mt-1">Order Total:</span>
            </div>
            <div className="text-right font-bold text-gray-800">
              <span className="block text-xs">₹{order.subtotal.toFixed(2)}</span>
              <span className="block text-xs text-red-500">-₹{order.discount.toFixed(2)}</span>
              <span className="block text-xs">₹{order.deliveryFee.toFixed(2)}</span>
              <span className="block text-sm font-extrabold text-indigo-700 mt-1">₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
