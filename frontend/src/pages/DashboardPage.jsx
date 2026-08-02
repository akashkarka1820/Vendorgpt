import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee, Receipt, Package, BookOpen, AlertTriangle, ArrowUpRight,
  TrendingUp, ShoppingCart, Clock, CheckCircle2, ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../services/api';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [salesTrend, setSalesTrend] = useState(null);
  const [timeframe, setTimeframe] = useState('7days');
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const [dashRes, salesRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get(`/analytics/sales?timeframe=${timeframe}`)
      ]);
      setDashboardData(dashRes.data);
      setSalesTrend(salesRes.data);
    } catch (err) {
      console.error("Dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Retail Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time Kirana store sales overview & automated stock alerts</p>
        </div>
        <Link
          to="/new-bill"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
        >
          <ShoppingCart size={18} />
          <span>Create New Bill</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Revenue</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3 font-mono">
            ₹{dashboardData?.todays_revenue?.toLocaleString('en-IN') || 0}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-semibold">
            <TrendingUp size={14} />
            <span>Live Sales Tracker</span>
          </div>
        </div>

        {/* Bills Today */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bills Today</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3 font-mono">
            {dashboardData?.bills_today || 0}
          </p>
          <span className="text-xs text-slate-500 mt-2 block font-medium">Completed Transactions</span>
        </div>

        {/* Products Sold Today */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Products Sold</span>
            <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Package size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3 font-mono">
            {dashboardData?.products_sold_today || 0}
          </p>
          <span className="text-xs text-slate-500 mt-2 block font-medium">Items Out of Stock Today</span>
        </div>

        {/* Pending Khata */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Khata</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-3 font-mono">
            ₹{dashboardData?.pending_khata?.toLocaleString('en-IN') || 0}
          </p>
          <Link to="/khata" className="text-xs text-amber-600 font-bold hover:underline mt-2 inline-block">
            View Credit Ledger →
          </Link>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Low Stock</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-3 font-mono">
            {dashboardData?.low_stock_count || 0} <span className="text-xs font-normal text-slate-500">Products</span>
          </p>
          <Link to="/inventory" className="text-xs text-rose-600 font-bold hover:underline mt-2 inline-block">
            Restock Inventory →
          </Link>
        </div>
      </div>

      {/* Main Charts & Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Sales Trend Analytics</h3>
              <p className="text-xs text-slate-500">Revenue growth derived directly from database invoices</p>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              {['today', '7days', '30days'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    timeframe === tf
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tf === 'today' ? 'Today' : tf === '7days' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend?.trend_data || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Top Selling Items</h3>
              <span className="text-xs text-slate-400 font-mono">By Revenue</span>
            </div>

            <div className="space-y-3">
              {dashboardData?.top_products?.length > 0 ? (
                dashboardData.top_products.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.product_name}</p>
                        <p className="text-[11px] text-slate-500">{item.quantity_sold} units sold</p>
                      </div>
                    </div>
                    <p className="text-xs font-extrabold text-slate-900 font-mono">₹{item.revenue}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">No product transactions recorded yet.</p>
              )}
            </div>
          </div>

          <Link to="/products" className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-emerald-600 hover:underline flex items-center justify-center gap-1">
            <span>Manage Product Catalog</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Recent Transactions Register */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Checkout Bills</h3>
            <p className="text-xs text-slate-500">Live invoices completed at checkout</p>
          </div>
          <Link to="/transactions" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
            <span>View All Transactions</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashboardData?.recent_transactions?.length > 0 ? (
                dashboardData.recent_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600">{tx.invoice_number}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{tx.customer_name}</td>
                    <td className="py-3 px-3 font-mono font-extrabold text-slate-900">₹{tx.grand_total}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        tx.payment_method === 'Khata' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {tx.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-400">No recent transactions.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
