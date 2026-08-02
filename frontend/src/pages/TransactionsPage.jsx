import React, { useState, useEffect } from 'react';
import { Receipt, Search, Download, Printer, Eye, X, Filter } from 'lucide-react';
import api from '../services/api';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedTx, setSelectedTx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [search, paymentFilter]);

  const fetchTransactions = async () => {
    try {
      const res = await api.get(`/transactions?search=${encodeURIComponent(search)}&payment_method=${encodeURIComponent(paymentFilter)}`);
      setTransactions(res.data);
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sales Register & Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">Complete historical record of created retail bills & ReportLab PDF exports</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Invoice number or Customer..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="bg-white border border-slate-200 text-slate-800 rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-emerald-500"
        >
          <option value="All">All Payment Methods</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="Khata">Khata Credit</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-100 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items Count</th>
                <th className="py-3.5 px-4">Grand Total</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{t.invoice_number}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{t.customer_name || 'Walk-in Customer'}</td>
                  <td className="py-3.5 px-4 font-mono">{t.items?.length || 0} items</td>
                  <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">₹{t.grand_total}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      t.payment_method === 'Khata' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {t.payment_method}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedTx(t)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                        title="View Bill Details"
                      >
                        <Eye size={16} />
                      </button>
                      <a
                        href={`http://127.0.0.1:8000/api/transactions/${t.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                        title="Download PDF Invoice"
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">{selectedTx.invoice_number}</h3>
                <p className="text-xs text-slate-500">{new Date(selectedTx.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedTx(null)} className="p-1 text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <p><span className="text-slate-400 font-semibold">Customer:</span> {selectedTx.customer_name}</p>
              <p><span className="text-slate-400 font-semibold">Payment:</span> {selectedTx.payment_method}</p>
            </div>

            {/* Line Items Table */}
            <div className="border rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedTx.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 font-bold">{item.product_name}</td>
                      <td className="p-2 font-mono">{item.quantity} {item.unit}</td>
                      <td className="p-2 font-mono">₹{item.unit_price}</td>
                      <td className="p-2 font-mono font-bold text-right">₹{item.line_total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl font-mono text-xs space-y-1">
              <div className="flex justify-between"><span>Subtotal:</span> <span>₹{selectedTx.subtotal}</span></div>
              <div className="flex justify-between"><span>Tax / GST:</span> <span>₹{selectedTx.tax}</span></div>
              <div className="flex justify-between"><span>Discount:</span> <span>- ₹{selectedTx.discount}</span></div>
              <div className="flex justify-between font-extrabold text-slate-900 text-sm border-t pt-1">
                <span>Grand Total:</span> <span className="text-emerald-600">₹{selectedTx.grand_total}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={`http://127.0.0.1:8000/api/transactions/${selectedTx.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-500"
              >
                <Download size={16} /> Download Official PDF Invoice
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
