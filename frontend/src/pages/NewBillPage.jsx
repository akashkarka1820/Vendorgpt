import React, { useState, useEffect, useContext } from 'react';
import {
  Mic, Search, Plus, Trash2, UserPlus, CheckCircle, AlertTriangle,
  Printer, Download, ShoppingBag, X, RefreshCw, CreditCard, Wallet, BookOpen, AlertCircle, QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import VoiceMicButton from '../components/VoiceMicButton';
import FuzzyMatchModal from '../components/FuzzyMatchModal';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function NewBillPage() {
  const { user } = useContext(AuthContext);
  const [billingMode, setBillingMode] = useState('voice'); // 'voice' or 'manual'
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Cash, UPI, Card, Khata
  
  // Customer selection
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', address: '' });

  // Manual search
  const [productQuery, setProductQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Voice & Fuzzy matching
  const [fuzzyModalItem, setFuzzyModalItem] = useState(null);
  const [isFuzzyOpen, setIsFuzzyOpen] = useState(false);

  // Invoice & Checkout state
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccessInvoice, setCheckoutSuccessInvoice] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Dynamic UPI Modal State
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiRefInvoice, setUpiRefInvoice] = useState('');

  // Fetch customers on load
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Live product search for manual billing
  useEffect(() => {
    if (productQuery.trim().length > 0) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.get(`/products/search?q=${encodeURIComponent(productQuery)}`);
          setSearchResults(res.data);
        } catch (err) {
          console.error(err);
        }
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [productQuery]);

  // Voice Process Handler
  const handleVoiceProcessSuccess = ({ text, validatedItems }) => {
    setErrorMessage('');
    validatedItems.forEach((item) => {
      if (item.status === 'confirmed' && item.matched_product_id) {
        // High confidence / exact match -> Auto add to cart
        console.log(`[CART] products added: ${item.matched_product_name} x ${item.quantity} ${item.matched_unit || item.unit}`);
        addToCart({
          product_id: item.matched_product_id,
          product_name: item.matched_product_name,
          telugu_name: item.matched_telugu_name,
          quantity: item.quantity,
          unit: item.matched_unit || item.unit,
          unit_price: item.matched_price,
          gst_percentage: item.matched_gst_percentage || 0
        });
      } else if (item.status === 'suggestion') {
        // Medium confidence match -> Prompt vendor confirmation
        setFuzzyModalItem(item);
        setIsFuzzyOpen(true);
      } else if (item.status === 'not_found') {
        // Low confidence / No match -> Alert vendor without adding or inventing items
        setErrorMessage(`Product "${item.raw_product}" could not be identified in catalog.`);
      }
    });
  };

  const addToCart = (productObj) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.product_id === productObj.product_id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += productObj.quantity;
        return updated;
      } else {
        return [...prev, productObj];
      }
    });
  };

  const updateCartQty = (product_id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === product_id) {
            const newQty = Math.max(0.1, item.quantity + delta);
            return { ...item, quantity: parseFloat(newQty.toFixed(2)) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (product_id) => {
    setCart((prev) => prev.filter((i) => i.product_id !== product_id));
  };

  // Cart Calculations
  const calculateCart = () => {
    let subtotal = 0;
    let totalTax = 0;
    cart.forEach((item) => {
      const lineBase = item.quantity * item.unit_price;
      const lineTax = lineBase * (item.gst_percentage / 100);
      subtotal += lineBase;
      totalTax += lineTax;
    });
    const grandTotal = Math.max(0, subtotal + totalTax - discount);
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2))
    };
  };

  const { subtotal, totalTax, grandTotal } = calculateCart();

  // Create new customer handler
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/customers', newCustomerForm);
      setCustomers((prev) => [...prev, res.data]);
      setSelectedCustomer(res.data);
      setShowAddCustomerModal(false);
      setNewCustomerForm({ name: '', phone: '', address: '' });
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to add customer");
    }
  };

  // Initiate Checkout Handler (Validates UPI or opens modal)
  const handleInitiateCheckout = () => {
    setErrorMessage('');
    if (cart.length === 0) {
      setErrorMessage("Cart is empty! Add products before checking out.");
      return;
    }

    if (paymentMethod.toLowerCase() === 'khata' && !selectedCustomer) {
      setErrorMessage("Khata payment requires a registered customer. Please select or add a customer!");
      return;
    }

    if (paymentMethod.toUpperCase() === 'UPI') {
      const activeUpiId = user?.upi_id?.trim() || 'akashkarka@ybl';
      if (!activeUpiId) {
        setErrorMessage("UPI payment is not configured. Please configure your UPI ID in Settings.");
        return;
      }
      if (grandTotal <= 0) {
        setErrorMessage("Grand total must be greater than ₹0 to generate a UPI QR code.");
        return;
      }
      setUpiRefInvoice(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
      setShowUpiModal(true);
      return;
    }

    // Direct checkout for Cash, Card, Khata
    executeCheckout();
  };

  // Execute Final Checkout API Call
  const executeCheckout = async () => {
    setCheckoutLoading(true);
    setShowUpiModal(false);
    try {
      const payload = {
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit: i.unit,
          unit_price: i.unit_price,
          gst_percentage: i.gst_percentage
        })),
        payment_method: paymentMethod,
        discount: parseFloat(discount) || 0
      };

      const res = await api.post('/billing/checkout', payload);
      if (res.data.success) {
        setCheckoutSuccessInvoice(res.data);
        setCart([]);
        setDiscount(0);
        setSelectedCustomer(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || "Checkout failed! Please check stock availability.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const activeUpiId = user?.upi_id || 'akashkarka@ybl';
  const activeShopName = user?.shop_name || 'Sri Kirana';
  const upiPaymentUri = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(activeShopName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Invoice ${upiRefInvoice}`)}`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">New Billing Counter</h1>
          <p className="text-xs text-slate-500 mt-0.5">Bilingual Telugu & English AI Voice Billing + Fast Manual POS</p>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setBillingMode('voice')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              billingMode === 'voice'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mic size={16} />
            <span>Voice Billing</span>
          </button>

          <button
            onClick={() => setBillingMode('manual')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              billingMode === 'manual'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search size={16} />
            <span>Manual Billing</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Voice or Manual Search Input */}
        <div className="lg:col-span-5 space-y-6">
          {billingMode === 'voice' ? (
            <VoiceMicButton
              onVoiceProcessSuccess={handleVoiceProcessSuccess}
              onError={(msg) => setErrorMessage(msg)}
            />
          ) : (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Search size={18} className="text-emerald-600" />
                <span>Search Product Catalog</span>
              </h3>

              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Type Rice, బియ్యం, Sugar, Tata Salt..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Search Results Dropdown List */}
              <div className="space-y-2 max-h-96 overflow-y-auto pt-2">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {p.product_name} {p.telugu_name ? `(${p.telugu_name})` : ''}
                      </h4>
                      <p className="text-xs text-slate-500">
                        ₹{p.selling_price}/{p.unit} • Stock: {p.stock_quantity} {p.unit}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        addToCart({
                          product_id: p.id,
                          product_name: p.product_name,
                          telugu_name: p.telugu_name,
                          quantity: 1,
                          unit: p.unit,
                          unit_price: p.selling_price,
                          gst_percentage: p.gst_percentage || 0
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                ))}

                {productQuery.trim().length > 0 && searchResults.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No products matching query.</p>
                )}
              </div>
            </div>
          )}

          {/* Customer Selection Widget */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Customer Details</h3>
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="text-xs text-emerald-600 hover:underline font-bold flex items-center gap-1"
              >
                <UserPlus size={14} />
                <span>Add Customer</span>
              </button>
            </div>

            {selectedCustomer ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{selectedCustomer.name}</h4>
                  <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>
                  <p className="text-xs text-amber-700 font-semibold mt-1">
                    Khata Balance: ₹{selectedCustomer.khata_balance}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div>
                <select
                  onChange={(e) => {
                    const cid = parseInt(e.target.value);
                    if (cid) {
                      const c = customers.find((cust) => cust.id === cid);
                      setSelectedCustomer(c || null);
                    } else {
                      setSelectedCustomer(null);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Walk-in Customer (Optional)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - Khata: ₹{c.khata_balance}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Billing Cart & Summary */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[500px]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShoppingBag size={20} className="text-emerald-600" />
                  <span>Billing Cart</span>
                </h3>
                <span className="text-xs bg-slate-100 font-mono px-3 py-1 rounded-full text-slate-600 font-bold">
                  {cart.length} Line Items
                </span>
              </div>

              {/* Cart Table */}
              <div className="overflow-x-auto my-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 uppercase tracking-wider font-bold">
                      <th className="py-2.5 px-2">Item</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-2">Price</th>
                      <th className="py-2.5 px-2">GST</th>
                      <th className="py-2.5 px-2 text-right">Total</th>
                      <th className="py-2.5 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.length > 0 ? (
                      cart.map((item) => {
                        const lineTotal = (item.quantity * item.unit_price * (1 + item.gst_percentage / 100)).toFixed(2);
                        return (
                          <tr key={item.product_id} className="hover:bg-slate-50">
                            <td className="py-3 px-2">
                              <p className="font-bold text-slate-900">{item.product_name}</p>
                              {item.telugu_name && (
                                <p className="text-[11px] text-slate-400 font-serif">{item.telugu_name}</p>
                              )}
                            </td>

                            <td className="py-3 px-2 text-center">
                              <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-xl">
                                <button
                                  onClick={() => updateCartQty(item.product_id, -1)}
                                  className="w-5 h-5 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 font-bold hover:bg-slate-200"
                                >
                                  -
                                </button>
                                <span className="font-mono font-bold text-slate-900">{item.quantity} {item.unit}</span>
                                <button
                                  onClick={() => updateCartQty(item.product_id, 1)}
                                  className="w-5 h-5 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 font-bold hover:bg-slate-200"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            <td className="py-3 px-2 font-mono font-semibold text-slate-700">₹{item.unit_price}</td>
                            <td className="py-3 px-2 font-mono text-slate-500">{item.gst_percentage}%</td>
                            <td className="py-3 px-2 text-right font-mono font-extrabold text-slate-900">₹{lineTotal}</td>
                            <td className="py-3 px-2 text-center">
                              <button
                                onClick={() => removeCartItem(item.product_id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400">
                          Cart is empty. Tap mic or search products to begin billing.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Billing Calculator Totals & Payment Selector */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold">₹{subtotal}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax</span>
                  <span className="font-mono font-semibold">₹{totalTax}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Discount (₹)</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-24 bg-white border border-slate-200 rounded-xl px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-base font-extrabold text-slate-900">
                  <span>Grand Total</span>
                  <span className="font-mono text-emerald-600 text-xl">₹{grandTotal}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: 'Cash', icon: Wallet },
                    { name: 'UPI', icon: CreditCard },
                    { name: 'Card', icon: CreditCard },
                    { name: 'Khata', icon: BookOpen }
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.name}
                        onClick={() => setPaymentMethod(m.name)}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                          paymentMethod === m.name
                            ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <Icon size={18} className={paymentMethod === m.name ? 'text-emerald-400' : 'text-slate-400'} />
                        <span>{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleInitiateCheckout}
                disabled={checkoutLoading || cart.length === 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
              >
                {checkoutLoading ? 'Processing Checkout...' : (
                  <>
                    <CheckCircle size={20} />
                    <span>Complete Transaction (₹{grandTotal})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fuzzy Match Confirmation Modal */}
      <FuzzyMatchModal
        isOpen={isFuzzyOpen}
        item={fuzzyModalItem}
        onClose={() => setIsFuzzyOpen(false)}
        onConfirmMatch={(selectedProduct, qty, unit) => {
          addToCart({
            product_id: selectedProduct.id,
            product_name: selectedProduct.product_name,
            telugu_name: selectedProduct.telugu_name,
            quantity: qty,
            unit: selectedProduct.unit || unit,
            unit_price: selectedProduct.selling_price,
            gst_percentage: selectedProduct.gst_percentage || 0
          });
          setIsFuzzyOpen(false);
        }}
      />

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Add Registered Customer</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Full Name *"
                value={newCustomerForm.name}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
              />
              <input
                type="text"
                required
                placeholder="Phone Number *"
                value={newCustomerForm.phone}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
              />
              <input
                type="text"
                placeholder="Address (Optional)"
                value={newCustomerForm.address}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
              />
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
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

      {/* Dynamic UPI Payment QR Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
                <QrCode size={22} className="text-emerald-600" />
                <span>Scan to Pay</span>
              </div>
              <button onClick={() => setShowUpiModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Dynamic Scannable QR Code */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center space-y-3">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 inline-block">
                <QRCodeSVG
                  value={upiPaymentUri}
                  size={210}
                  bgColor={"#ffffff"}
                  fgColor={"#0f172a"}
                  level={"H"}
                  includeMargin={true}
                />
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-base">{activeShopName}</h4>
                <p className="text-xs font-mono text-slate-500 font-semibold mt-0.5">UPI ID: {activeUpiId}</p>
              </div>
            </div>

            {/* Total Amount & Invoice Info */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl font-mono text-xs text-slate-800 space-y-1">
              <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Amount Payable:</span>
                <span className="text-emerald-600 text-lg">₹{grandTotal}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Invoice Reference:</span>
                <span>{upiRefInvoice}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium italic">
              Scan using PhonePe, Google Pay, Paytm, BHIM, or any UPI app
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowUpiModal(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel Payment
              </button>
              <button
                disabled={checkoutLoading}
                onClick={executeCheckout}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 hover:bg-emerald-500 disabled:opacity-50"
              >
                {checkoutLoading ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                <span>Payment Received</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Success Invoice Preview Modal */}
      {checkoutSuccessInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle size={36} />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Transaction Completed!</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">Invoice #: {checkoutSuccessInvoice.invoice_number}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl font-mono text-sm space-y-1 text-slate-800 border border-slate-100">
              <p className="flex justify-between"><span>Grand Total:</span> <span className="font-bold text-emerald-600">₹{checkoutSuccessInvoice.grand_total}</span></p>
              <p className="flex justify-between text-xs text-slate-500"><span>Payment Method:</span> <span>{checkoutSuccessInvoice.payment_method}</span></p>
            </div>

            <div className="flex gap-3">
             <button
  onClick={async () => {
    try {
      const response = await api.get(
        `/transactions/${checkoutSuccessInvoice.transaction_id}/pdf`,
        {
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], {
        type: 'application/pdf',
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${checkoutSuccessInvoice.invoice_number || 'invoice'}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download bill. Please try again.');
    }
  }}
  className="flex-1 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800"
>
  <Download size={16} /> Download PDF
</button>
              <button
                onClick={() => setCheckoutSuccessInvoice(null)}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-500"
              >
                <Plus size={16} /> Next Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
