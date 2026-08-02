import React, { useState, useEffect } from 'react';
import { Warehouse, AlertTriangle, Plus, RefreshCw, History, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import api from '../services/api';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    change_type: 'ADDITION',
    quantity: '10',
    note: 'Stock replenishment'
  });

  useEffect(() => {
    fetchInventory();
    fetchMovements();
  }, [statusFilter]);

  const fetchInventory = async () => {
    try {
      const res = await api.get(`/inventory?status_filter=${statusFilter}`);
      setInventory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const res = await api.get('/inventory/movements');
      setMovements(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdjust = (product) => {
    setSelectedProduct(product);
    setAdjustForm({
      change_type: 'ADDITION',
      quantity: '10',
      note: 'Restock inventory'
    });
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await api.post('/inventory/adjust', {
        product_id: selectedProduct.id,
        change_type: adjustForm.change_type,
        quantity: parseFloat(adjustForm.quantity),
        note: adjustForm.note
      });
      setShowAdjustModal(false);
      fetchInventory();
      fetchMovements();
    } catch (err) {
      alert(err.response?.data?.detail || "Stock adjustment failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Stock & Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Automated stock deduction on checkout + low stock alerts</p>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border">
          {['ALL', 'IN STOCK', 'LOW STOCK', 'OUT OF STOCK'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Stock Level Directory</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Current Stock</th>
                  <th className="py-3 px-3">Min. Stock</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{item.product_name}</p>
                      {item.telugu_name && <p className="text-[11px] text-slate-400 font-serif">{item.telugu_name}</p>}
                    </td>
                    <td className="py-3 px-3 font-mono font-extrabold text-slate-900">{item.current_stock} {item.unit}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{item.minimum_stock} {item.unit}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'OUT OF STOCK' ? 'bg-rose-100 text-rose-700' :
                        item.status === 'LOW STOCK' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleOpenAdjust(item)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Stock Movements Log */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <History size={18} className="text-slate-600" />
            <span>Stock Movement Log</span>
          </h3>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {movements.map((m) => (
              <div key={m.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{m.product_name}</span>
                  <span className={`font-mono font-extrabold ${m.change_type === 'DEDUCTION' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {m.change_type === 'DEDUCTION' ? '-' : '+'}{m.quantity}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{m.note || m.change_type}</span>
                  <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Adjust Stock - {selectedProduct.product_name}</h3>
            <form onSubmit={handleSaveAdjustment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Adjustment Type</label>
                <select
                  value={adjustForm.change_type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, change_type: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-bold"
                >
                  <option value="ADDITION">ADDITION (+ Restock / Purchase)</option>
                  <option value="DEDUCTION">DEDUCTION (- Damage / Removal)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (= Set Exact Stock)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Quantity ({selectedProduct.unit})</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Note / Reason</label>
                <input
                  type="text"
                  value={adjustForm.note}
                  onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-2.5 rounded-xl border text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
