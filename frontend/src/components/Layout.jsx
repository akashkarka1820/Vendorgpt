import React, { useState, useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse, Users, BookOpen,
  Receipt, BarChart3, Settings, LogOut, Menu, X, Store, Mic
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'New Bill', path: '/new-bill', icon: ShoppingCart, highlight: true },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Inventory', path: '/inventory', icon: Warehouse },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Khata', path: '/khata', icon: BookOpen },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-extrabold text-white">
            V
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide text-emerald-400">VendorGPT</h1>
            <p className="text-xs text-slate-400">{user?.shop_name || 'Kirana Store'}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out flex flex-col justify-between
        md:translate-x-0 md:static md:z-auto shadow-xl
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-emerald-900/50">
              V
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                VendorGPT
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono uppercase">AI</span>
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Store size={12} className="text-emerald-400" />
                <span className="truncate max-w-[130px]">{user?.shop_name || 'Smart Billing'}</span>
              </p>
            </div>
          </div>

          {/* Nav Items List */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150
                    ${item.highlight ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30 font-semibold' : ''}
                    ${isActive && !item.highlight ? 'bg-slate-800 text-emerald-400 font-semibold shadow-inner' : ''}
                    ${!isActive && !item.highlight ? 'hover:bg-slate-800/60 hover:text-white' : ''}
                  `}
                >
                  <Icon size={18} className={item.highlight ? 'text-white' : ''} />
                  <span>{item.name}</span>
                  {item.name === 'New Bill' && (
                    <span className="ml-auto text-[10px] bg-amber-400 text-slate-900 font-bold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                      <Mic size={10} /> Voice
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Footer info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <div className="mb-3 px-2">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.shop_owner_name || 'Vendor Owner'}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email || 'vendor@kirana.com'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
