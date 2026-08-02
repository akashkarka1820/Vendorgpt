import React, { useState, useEffect } from 'react';
import { BookOpen, IndianRupee, Users, ArrowUpRight, ArrowDownLeft, CheckCircle, Plus } from 'lucide-react';
import api from '../services/api';

export default function KhataPage() {
  const [khataSummary, setKhataSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDesc, setPayDesc] = useState('Payment received');

  useEffect(() => {
    fetchKhata();
  }, []);

  const fetchKhata = async () => {
    try {
      const res = await api.get('/khata/summary');
      setKhataSummary(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (debtor) => {
    setSelectedDebtor(debtor);
    setPayAmount(debtor.khata_balance.toString());
    setPayDesc('Payment received in cash / UPI');
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedDebtor) return;
    try {
      await api.post('/khata/payment', {
        customer_id: selectedDebtor.customer_id,
        amount: parseFloat(payAmount),
        description: payDesc
      });
      setShowPaymentModal(false);
      fetchKhata();
    } catch (err) {
      alert(err.response?.data?.detail || "Payment failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Digital Khata Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer credit, record payments & track outstanding dues</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 text-amber-900 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Total Pending Dues</span>
            <p className="text-3xl font-extrabold font-mono mt-1">
              ₹{khataSummary?.total_pending_khata?.toLocaleString('en-IN') || 0}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center font-bold">
            <BookOpen size={24} />
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-200 text-blue-900 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Debtors Count</span>
            <p className="text-3xl font-extrabold font-mono mt-1">
              {khataSummary?.total_debtors_count || 0} <span className="text-xs font-normal">Customers</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-200 text-blue-800 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Debtors List & Ledger Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Debtors List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Pending Credit Customers</h3>
          <div className="space-y-3">
            {khataSummary?.debtors?.length > 0 ? (
              khataSummary.debtors.map((d) => (
                <div key={d.customer_id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                    <p className="text-xs text-slate-500">{d.phone}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Due Amount</span>
                      <span className="font-mono font-extrabold text-amber-600 text-base">₹{d.khata_balance}</span>
                    </div>

                    <button
                      onClick={() => handleOpenPayment(d)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Record Payment
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">No pending credit customer dues!</p>
            )}
          </div>
        </div>

        {/* Recent Ledger Transactions */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Recent Khata Activity</h3>
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {khataSummary?.recent_entries?.map((e) => (
              <div key={e.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{e.customer_name}</span>
                  <span className={`font-mono font-extrabold ${e.transaction_type === 'CREDIT' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {e.transaction_type === 'CREDIT' ? '+' : '-' }₹{e.amount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{e.description || e.transaction_type}</span>
                  <span>{new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedDebtor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Record Payment - {selectedDebtor.name}</h3>
            <p className="text-xs text-slate-500">Current Outstanding Due: <span className="font-mono font-bold text-amber-600">₹{selectedDebtor.khata_balance}</span></p>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Payment Note / Method</label>
                <input
                  type="text"
                  value={payDesc}
                  onChange={(e) => setPayDesc(e.target.value)}
                  className="w-full bg-slate-50 border rounded-xl p-3 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2.5 rounded-xl border text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
