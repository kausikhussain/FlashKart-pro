import React, { useState, useEffect } from 'react';
import { Bell, ShoppingBag, Sparkles, Circle, Check } from 'lucide-react';
import { Notification } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  userId: string;
  refreshTrigger: number;
}

export default function NotificationCenter({ userId, refreshTrigger }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId, refreshTrigger]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div id="notif-center-root" className="relative">
      <button
        id="btn-toggle-notifications"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer"
      >
        <Bell className="w-5.5 h-5.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay for closing */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-indigo-50/20">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-900 text-sm font-sans">Notification Alert Hub</span>
                  <span className="text-xs text-indigo-700 font-semibold bg-indigo-100/50 px-2 py-0.5 rounded-full">
                    {unreadCount} Active
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      notifications.filter(n => !n.read).forEach(n => markAsRead(n.id));
                    }}
                    className="text-xs text-indigo-700 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.read && markAsRead(notif.id)}
                      className={`p-4 transition-all duration-300 flex items-start gap-3 cursor-pointer ${
                        notif.read ? 'bg-white hover:bg-gray-50/50' : 'bg-indigo-50/10 hover:bg-indigo-50/20'
                      }`}
                    >
                      <div className="mt-0.5">
                        {notif.type === 'order' ? (
                          <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className={`text-xs font-bold truncate ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notif.title}
                          </h5>
                          {!notif.read && (
                            <Circle className="w-2 h-2 fill-red-500 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className={`text-xs leading-relaxed ${notif.read ? 'text-gray-400' : 'text-gray-600'}`}>
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-gray-400 font-mono block mt-1.5">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
