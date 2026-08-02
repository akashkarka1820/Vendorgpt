import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, IndianRupee, PieChart as PieIcon, Calendar } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';

const COLORS = ['#10b981', '#0284c7', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function AnalyticsPage() {
  const [salesData, setSalesData] = useState(null);
  const [productAnalytics, setProductAnalytics] = useState(null);
  const [timeframe, setTimeframe] = useState('7days');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      const [salesRes, prodRes] = await Promise.all([
        api.get(`/analytics/sales?timeframe=${timeframe}`),
        api.get('/analytics/products')
      ]);
      setSalesData(salesRes.data);
      setProductAnalytics(prodRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Business Intelligence & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time store metrics calculated dynamically from database transactions</p>
        </div>
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border">
          {['today', '7days', '30days'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === tf ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tf === 'today' ? 'Today' : tf === '7days' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Period Revenue</span>
          <p className="text-2xl font-extrabold font-mono text-slate-900 mt-2">₹{salesData?.total_revenue || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Bills Issued</span>
          <p className="text-2xl font-extrabold font-mono text-slate-900 mt-2">{salesData?.total_bills || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Bill Value</span>
          <p className="text-2xl font-extrabold font-mono text-emerald-600 mt-2">₹{salesData?.avg_bill_value || 0}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Revenue Trend Chart</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData?.trend_data || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#dcfce7" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Sales Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Category Sales Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productAnalytics?.category_sales || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="sales" fill="#0284c7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
