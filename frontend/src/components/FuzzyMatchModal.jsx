import React from 'react';
import { AlertTriangle, CheckCircle, HelpCircle, X } from 'lucide-react';

export default function FuzzyMatchModal({ item, isOpen, onClose, onConfirmMatch, onManualSearchSelect }) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <HelpCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Confirm Product Match</h3>
              <p className="text-xs text-slate-500">
                Spoken item: <span className="font-semibold text-slate-800">"{item.raw_product}"</span> ({item.quantity} {item.unit})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 mb-4 text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            We couldn't 100% confidently identify this product automatically. Please select the correct item below:
          </span>
        </div>

        {/* Suggested Candidates List */}
        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {item.suggested_products && item.suggested_products.length > 0 ? (
            item.suggested_products.map((p) => (
              <button
                key={p.id}
                onClick={() => onConfirmMatch(p, item.quantity, item.unit)}
                className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all duration-150 flex items-center justify-between group"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700">
                    {p.product_name} {p.telugu_name ? `(${p.telugu_name})` : ''}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Rs. {p.selling_price}/{p.unit || item.unit}
                    {p.score ? ` • Match: ${p.score}%` : ''}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <CheckCircle size={18} />
                </div>
              </button>
            ))
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">No matching candidates found in database.</p>
          )}
        </div>

        {/* Manual search fallback */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
          >
            Skip Item
          </button>
          <button
            onClick={() => {
              onClose();
              if (onManualSearchSelect) onManualSearchSelect(item.raw_product);
            }}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
          >
            Manual Search
          </button>
        </div>
      </div>
    </div>
  );
}
