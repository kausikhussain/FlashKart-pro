import React from 'react';
import { Shield, User as UserIcon, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface RoleSwitcherProps {
  currentUser: User | null;
  onSwitchRole: (role: 'customer' | 'admin') => void;
}

export default function RoleSwitcher({ currentUser, onSwitchRole }: RoleSwitcherProps) {
  if (!currentUser) return null;

  return (
    <div id="role-switcher-container" className="fixed bottom-6 right-6 z-50 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-3 border border-slate-200/80 flex items-center gap-3">
      <div className="flex flex-col text-right">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold">Current Identity</span>
        <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 justify-end">
          {currentUser.role === 'admin' ? (
            <>
              <Shield className="w-3 h-3 text-indigo-600" />
              Admin
            </>
          ) : (
            <>
              <UserIcon className="w-3 h-3 text-slate-600" />
              Customer
            </>
          )}
        </span>
      </div>
      <button
        id="btn-switch-role"
        onClick={() => onSwitchRole(currentUser.role === 'admin' ? 'customer' : 'admin')}
        className={`p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 text-xs font-bold cursor-pointer ${
          currentUser.role === 'admin'
            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
        }`}
        title="Instantly switch roles for demo testing"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Switch to {currentUser.role === 'admin' ? 'Customer' : 'Admin'}
      </button>
    </div>
  );
}
