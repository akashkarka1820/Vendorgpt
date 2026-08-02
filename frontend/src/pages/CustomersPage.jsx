import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Phone, Mail, MapPin, BookOpen, ChevronRight, X } from 'lucide-react';
import api from '../services/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      const res = await api.get(`/customers?search=${encodeURIComponent(search)}`);
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomerDetails = async (id) => {
    try {
      const res = await api.get(`/customers/${id}`);
      setSelectedCustomerDetail(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', addForm);
      setShowAddModal(false);
      setAddForm({ name: '', phone: '', email: '', address: '' });
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.detail || "Customer creation failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer purchase history & digital Khata credit ledgers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md"
        >
          <Plus size={18} />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer by name or phone..."
          className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => (
          <div
            key={c.id}
            onClick={() => fetchCustomerDetails(c.id)}
            className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
                  {c.name}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Phone size={12} /> {c.phone}
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-slate-600 transition-colors">
                <ChevronRight size={18} />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Khata Balance</span>
              <span className={`font-mono font-extrabold text-sm ${c.khata_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                ₹{c.khata_balance}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Detail Modal / Drawer */}
      {selectedCustomerDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl">{selectedCustomerDetail.customer.name}</h3>
                <p className="text-xs text-slate-500">{selectedCustomerDetail.customer.phone} • {selectedCustomerDetail.customer.address || 'No address'}</p>
              </div>
              <button onClick={() => setSelectedCustomerDetail(null)} className="p-1 text-slate-400">
                <X size={22} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="text-[11px] font-bold text-amber-700 uppercase">Khata Balance</span>
                <p className="text-lg font-mono font-extrabold text-amber-800">₹{selectedCustomerDetail.customer.khata_balance}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-700 uppercase">Total Spent</span>
                <p className="text-lg font-mono font-extrabold text-emerald-800">₹{selectedCustomerDetail.total_spent}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                <span className="text-[11px] font-bold text-blue-700 uppercase">Total Bills</span>
                <p className="text-lg font-mono font-extrabold text-blue-800">{selectedCustomerDetail.total_purchases_count}</p>
              </div>
            </div>

            {/* Recent Purchases List */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-3">Transaction History</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedCustomerDetail.recent_transactions.map((tx) => (
                  <div key={tx.id} className="p-3 bg-slate-50 rounded-2xl border flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-bold text-emerald-600">{tx.invoice_number}</span>
                      <span className="text-slate-400 text-[10px] block">{new Date(tx.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="font-extrabold text-slate-900">₹{tx.grand_total} ({tx.payment_method})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Add New Customer</h3>
            <form onSubmit={handleAddCustomer} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Name *"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full bg-slate-50 border rounded-xl p-3 text-xs"
              />
              <input
                type="text"
                required
                placeholder="Phone *"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                className="w-full bg-slate-50 border rounded-xl p-3 text-xs"
              />
              <input
                type="email"
                placeholder="Email (Optional)"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full bg-slate-50 border rounded-xl p-3 text-xs"
              />
              <input
                type="text"
                placeholder="Address (Optional)"
                value={addForm.address}
                onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                className="w-full bg-slate-50 border rounded-xl p-3 text-xs"
              />
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
