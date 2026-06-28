import React, { useState } from 'react';
import { User, Shield, Mail, Lock, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoLogin = async (role: 'customer' | 'admin') => {
    setLoading(true);
    setError('');
    const demoEmail = role === 'admin' ? 'admin@freshkart.com' : 'customer@freshkart.com';
    const demoPassword = role === 'admin' ? 'admin' : 'password';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const url = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const body = isRegistering ? { email, password, name } : { email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed');
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-screen-outer" className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-100/40 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-slate-200/40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100 grid md:grid-cols-12"
      >
        {/* Left Side: Product branding and Demo quick access */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-8 text-white flex flex-col justify-between relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md">
                <ShoppingBag className="w-6 h-6 text-indigo-200" />
              </div>
              <span className="text-xl font-bold tracking-tight font-sans">FreshKart <span className="text-indigo-300">Pro</span></span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight mb-4 font-sans">
              Supercharge your grocery list with AI.
            </h2>
            <p className="text-indigo-100/90 text-sm leading-relaxed mb-8">
              Experience the next generation of e-commerce. Explore intelligent recipe integration, personalized demand forecasting, and real-time shipment logistics.
            </p>
          </div>

          <div className="relative z-10 mt-auto pt-6 border-t border-white/10">
            <span className="text-xs uppercase tracking-wider text-indigo-300 font-mono font-semibold block mb-3">
              Fast Track Demo Access
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="btn-demo-customer"
                onClick={() => handleDemoLogin('customer')}
                className="bg-white/10 hover:bg-white/20 transition-all p-3 rounded-2xl border border-white/10 flex flex-col items-start text-left cursor-pointer group"
              >
                <div className="p-1.5 bg-indigo-400/20 rounded-lg mb-2 text-indigo-300">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold block">Jane Doe</span>
                <span className="text-[10px] text-indigo-200 block mt-0.5 flex items-center gap-1">
                  Customer Demo <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              <button
                id="btn-demo-admin"
                onClick={() => handleDemoLogin('admin')}
                className="bg-white/10 hover:bg-white/20 transition-all p-3 rounded-2xl border border-white/10 flex flex-col items-start text-left cursor-pointer group"
              >
                <div className="p-1.5 bg-indigo-400/20 rounded-lg mb-2 text-indigo-300">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold block">Fulfillment</span>
                <span className="text-[10px] text-indigo-200 block mt-0.5 flex items-center gap-1">
                  Admin Demo <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Traditional Login / Register Form */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8 text-center md:text-left">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">
                {isRegistering ? 'Create your account' : 'Sign in to FreshKart Pro'}
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                {isRegistering 
                  ? 'Get started with fresh organics and custom smart recipe lists.' 
                  : 'Welcome back! Your cart and orders are synced across all sessions.'}
              </p>
            </div>

            {error && (
              <div id="login-error-alert" className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <form id="login-register-form" onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 font-mono">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="input-name"
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 font-mono">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="input-email"
                    type="email"
                    required
                    placeholder="customer@freshkart.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 font-mono">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="input-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                id="btn-submit-auth"
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-3 px-4 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isRegistering ? 'Register & Enter' : 'Secure Login'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                id="btn-toggle-auth-mode"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs text-indigo-700 hover:text-indigo-800 font-bold cursor-pointer"
              >
                {isRegistering ? 'Already have an account? Sign in' : "Don't have an account yet? Create one"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
