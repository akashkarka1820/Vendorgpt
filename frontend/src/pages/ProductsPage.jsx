import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit2, Trash2, X, Tag, IndianRupee, Mic, Keyboard, Volume2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Entry Mode & Language Toggles for Rural Vendors
  const [entryMode, setEntryMode] = useState('voice'); // 'voice' or 'manual'
  const [selectedLang, setSelectedLang] = useState('te'); // 'te' or 'en'
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');

  const [formData, setFormData] = useState({
    product_name: '',
    telugu_name: '',
    category: 'Groceries',
    barcode: '',
    unit: 'packet',
    selling_price: '',
    purchase_price: '',
    gst_percentage: '0',
    stock_quantity: '50',
    minimum_stock: '10'
  });

  const categories = [
    { value: 'Groceries', labelEn: 'Groceries', labelTe: 'కిరాణా (Groceries)' },
    { value: 'Spices', labelEn: 'Spices & Masala', labelTe: 'మసాలాలు (Spices)' },
    { value: 'Beverages', labelEn: 'Beverages', labelTe: 'పానీయాలు (Beverages)' },
    { value: 'Grains', labelEn: 'Grains & Rice', labelTe: 'ధాన్యాలు & బియ్యం (Grains)' },
    { value: 'Pulses', labelEn: 'Pulses & Dal', labelTe: 'పప్పుధాన్యాలు (Pulses)' },
    { value: 'Oils', labelEn: 'Edible Oils', labelTe: 'నూనెలు (Oils)' },
    { value: 'Dairy', labelEn: 'Dairy & Bakery', labelTe: 'పాలు & బేకరీ (Dairy)' },
    { value: 'Snacks', labelEn: 'Snacks & Biscuits', labelTe: 'స్నాక్స్ & బిస్కెట్లు (Snacks)' },
    { value: 'Personal Care', labelEn: 'Personal Care', labelTe: 'వ్యక్తిగత సంరక్షణ (Personal Care)' },
    { value: 'Others', labelEn: 'Others', labelTe: 'ఇతరములు (Others)' }
  ];

  const units = [
    { value: 'packet', labelEn: 'packet', labelTe: 'ప్యాకెట్ (packet)' },
    { value: 'kg', labelEn: 'kg (Kilogram)', labelTe: 'కిలో (kg)' },
    { value: 'g', labelEn: 'gram', labelTe: 'గ్రామ్ (g)' },
    { value: 'liter', labelEn: 'liter', labelTe: 'లీటర్ (liter)' },
    { value: 'piece', labelEn: 'piece / pcs', labelTe: 'పీస్ (piece)' },
    { value: 'bottle', labelEn: 'bottle', labelTe: 'బాటిల్ (bottle)' },
    { value: 'box', labelEn: 'box', labelTe: 'బాక్స్ (box)' }
  ];

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter]);

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(categoryFilter)}`);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setEntryMode('voice');
    setSelectedLang('te');
    setVoiceStatus('');
    setFormData({
      product_name: '',
      telugu_name: '',
      category: 'Groceries',
      barcode: '',
      unit: 'packet',
      selling_price: '',
      purchase_price: '',
      gst_percentage: '0',
      stock_quantity: '50',
      minimum_stock: '10'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setEntryMode('manual');
    setSelectedLang('en');
    setVoiceStatus('');
    setFormData({
      product_name: product.product_name || '',
      telugu_name: product.telugu_name || '',
      category: product.category || 'Groceries',
      barcode: product.barcode || '',
      unit: product.unit || 'packet',
      selling_price: product.selling_price,
      purchase_price: product.purchase_price || 0,
      gst_percentage: product.gst_percentage || 0,
      stock_quantity: product.stock_quantity,
      minimum_stock: product.minimum_stock
    });
    setShowModal(true);
  };

  const mediaRecorderRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);
  const recognitionRef = React.useRef(null);
  const [liveTranscript, setLiveTranscript] = useState('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = selectedLang === 'te' ? 'te-IN' : 'en-IN';

      rec.onresult = (event) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript + ' ';
        }
        const clean = text.trim();
        if (clean) {
          setLiveTranscript(clean);
          console.log(`[PRODUCT-ASR] live SpeechRecognition result: "${clean}"`);
        }
      };

      recognitionRef.current = rec;
    }
  }, [selectedLang]);

  const startVoiceRecording = async () => {
    try {
      setIsListening(true);
      setVoiceStatus(selectedLang === 'te' ? 'వింటున్నాము... మాట్లాడండి...' : 'Listening... Speak product name...');
      setLiveTranscript('');
      audioChunksRef.current = [];

      console.log('[PRODUCT-ASR] recording started');
      console.log(`[PRODUCT-ASR] selected language: ${selectedLang}`);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = selectedLang === 'te' ? 'te-IN' : 'en-IN';
          recognitionRef.current.start();
        } catch (err) {
          console.warn('[PRODUCT-ASR] Live recognition notice:', err);
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
    } catch (err) {
      console.error('[PRODUCT-ASR] Microphone permission or access error:', err);
      setIsListening(false);
      setVoiceStatus('Could not recognize product name. Please try again.');
    }
  };

  const stopVoiceRecording = async () => {
    console.log('[PRODUCT-ASR] recording stopped');
    setIsListening(false);
    setVoiceStatus(selectedLang === 'te' ? 'వాయిస్ ప్రాసెస్ చేయబడుతోంది...' : 'Processing audio...');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }

    setTimeout(async () => {
      try {
        let finalTranscript = liveTranscript ? liveTranscript.trim() : '';

        if (!finalTranscript && audioChunksRef.current.length > 0) {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

          console.log(`[PRODUCT-ASR] MIME type: ${mimeType}`);
          console.log(`[PRODUCT-ASR] blob size: ${audioBlob.size} bytes`);
          console.log(`[PRODUCT-ASR] selected language: ${selectedLang}`);
          console.log('[PRODUCT-ASR] endpoint called: /api/voice/transcribe');

          const formDataPayload = new FormData();
          formDataPayload.append('file', audioBlob, 'recording.webm');
          formDataPayload.append('language', selectedLang);

          const res = await api.post('/voice/transcribe', formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 10000
          });

          console.log(`[PRODUCT-ASR] HTTP status: ${res.status}`);
          console.log('[PRODUCT-ASR] raw response:', res.data);

          if (res.data && res.data.success && res.data.transcription) {
            finalTranscript = res.data.transcription.trim();
          }
        }

        console.log(`[PRODUCT-ASR] transcription: "${finalTranscript}"`);

        if (!finalTranscript) {
          console.warn('[PRODUCT-ASR] Speech recognition failed to produce text');
          setVoiceStatus('Could not recognize product name. Please try again.');
          return;
        }

        if (selectedLang === 'te') {
          setFormData((prev) => ({ ...prev, telugu_name: finalTranscript }));
          setVoiceStatus(`గుర్తించబడిన వస్తువు: "${finalTranscript}"`);

          try {
            const revRes = await api.get(`/products/reverse-transliterate?text=${encodeURIComponent(finalTranscript)}`);
            const englishAlias = (revRes.data && revRes.data.english) ? revRes.data.english : finalTranscript;
            setFormData((prev) => ({ ...prev, product_name: englishAlias }));
            console.log(`[PRODUCT-ASR] product name populated: English='${englishAlias}', Telugu='${finalTranscript}'`);
          } catch (revErr) {
            console.warn('[PRODUCT-ASR] Reverse transliteration error:', revErr);
            setFormData((prev) => ({ ...prev, product_name: finalTranscript }));
          }
        } else {
          setFormData((prev) => ({ ...prev, product_name: finalTranscript }));
          setVoiceStatus(`Recognized Product: "${finalTranscript}"`);

          try {
            const trRes = await api.get(`/products/transliterate?text=${encodeURIComponent(finalTranscript)}`);
            const teluguAlias = (trRes.data && trRes.data.telugu) ? trRes.data.telugu : finalTranscript;
            setFormData((prev) => ({ ...prev, telugu_name: teluguAlias }));
            console.log(`[PRODUCT-ASR] product name populated: English='${finalTranscript}', Telugu='${teluguAlias}'`);
          } catch (trErr) {
            console.warn('[PRODUCT-ASR] Transliteration error:', trErr);
            setFormData((prev) => ({ ...prev, telugu_name: finalTranscript }));
          }
        }
      } catch (procErr) {
        console.error('[PRODUCT-ASR] Error during voice processing:', procErr);
        setVoiceStatus('Could not recognize product name. Please try again.');
      }
    }, 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_name && !formData.telugu_name) {
      alert(selectedLang === 'te' ? "దయచేసి వస్తువు పేరు మైక్ ద్వారా చెప్పండి లేదా నమోదు చేయండి." : "Please provide a product name or speak into the mic.");
      return;
    }

    try {
      const payload = {
        product_name: formData.product_name.trim() || formData.telugu_name.trim(),
        telugu_name: formData.telugu_name.trim() || formData.product_name.trim(),
        category: formData.category,
        barcode: formData.barcode,
        unit: formData.unit,
        selling_price: parseFloat(formData.selling_price),
        purchase_price: parseFloat(formData.purchase_price) || 0,
        gst_percentage: parseFloat(formData.gst_percentage) || 0,
        stock_quantity: parseFloat(formData.stock_quantity) || 0,
        minimum_stock: parseFloat(formData.minimum_stock) || 10
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.detail || "Save failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to deactivate this product?")) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleProductNameChange = async (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, product_name: val }));

    if (val.trim()) {
      try {
        const res = await api.get(`/products/transliterate?text=${encodeURIComponent(val)}`);
        if (res.data && res.data.telugu) {
          setFormData((prev) => ({ ...prev, telugu_name: res.data.telugu }));
        }
      } catch (err) {
        console.warn("Transliteration API error:", err);
      }
    } else {
      setFormData((prev) => ({ ...prev, telugu_name: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Product Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">Multilingual Voice Product Creation (తెలుగు & English) + Smart Inventory</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5"
        >
          <Mic size={18} />
          <span>Add Product (వాయిస్ / Voice)</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by English name, Telugu name (చికెన్ మసాలా), or Barcode..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white border border-slate-200 text-slate-800 rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-emerald-500"
        >
          <option value="All">All Categories / అన్ని కేటగిరీలు</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.labelTe}</option>
          ))}
        </select>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-100 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Product Name (English)</th>
                <th className="py-3.5 px-4">తెలుగు పేరు (Telugu Name)</th>
                <th className="py-3.5 px-4">Category / వర్గం</th>
                <th className="py-3.5 px-4">Price / ధర</th>
                <th className="py-3.5 px-4">GST %</th>
                <th className="py-3.5 px-4">Stock / నిల్వ</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{p.product_name}</td>
                  <td className="py-3.5 px-4 font-serif text-slate-800 font-bold text-sm text-emerald-700">{p.telugu_name || '-'}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                      {p.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">₹{p.selling_price}/{p.unit}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{p.gst_percentage}%</td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className={`font-bold ${p.stock_quantity <= p.minimum_stock ? 'text-rose-600' : 'text-slate-800'}`}>
                      {p.stock_quantity} {p.unit}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-600"
                        title="Edit Product"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        title="Deactivate Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rural-Friendly Multilingual Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            {/* Modal Header & Close */}
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <Sparkles size={20} className="text-emerald-600" />
                  <span>{editingProduct ? 'Edit Product' : 'కొత్త వస్తువును చేర్చండి (Add Product)'}</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Rural Vendor Multilingual Voice Entry Mode</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            {/* Entry Mode & Language Selectors */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
              {/* Mode Toggle */}
              <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setEntryMode('voice')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    entryMode === 'voice' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mic size={14} />
                  <span>🎤 వాయిస్</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('manual')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    entryMode === 'manual' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Keyboard size={14} />
                  <span>⌨ మ్యాన్యువల్</span>
                </button>
              </div>

              {/* Language Selection */}
              <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setSelectedLang('te')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    selectedLang === 'te' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  తెలుగు
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLang('en')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedLang === 'en' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* VOICE ENTRY SECTION */}
              {entryMode === 'voice' && (
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl text-center space-y-3">
                  <p className="text-xs font-extrabold text-emerald-900">
                    {selectedLang === 'te' 
                      ? 'మైక్ బటన్ నొక్కి వస్తువు పేరు చెప్పండి (ఉదా: "చికెన్ మసాలా")' 
                      : 'Tap mic and speak product name (e.g. "Chicken Masala")'}
                  </p>

                  <button
                    type="button"
                    onClick={isListening ? stopVoiceRecording : startVoiceRecording}
                    className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg transition-all transform active:scale-95 cursor-pointer ${
                      isListening 
                        ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200' 
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                    }`}
                  >
                    <Mic size={28} />
                  </button>

                  {voiceStatus && (
                    <div className="p-2.5 bg-white/90 rounded-xl border border-emerald-200 text-xs font-bold text-slate-800 font-serif flex items-center justify-center gap-2">
                      <Volume2 size={16} className="text-emerald-600 shrink-0" />
                      <span>{voiceStatus}</span>
                    </div>
                  )}

                  {/* Display Recognized Names */}
                  {(formData.telugu_name || formData.product_name) && (
                    <div className="grid grid-cols-2 gap-2 text-left pt-1">
                      <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">తెలుగు పేరు (Telugu)</span>
                        <span className="text-xs font-serif font-extrabold text-emerald-800">{formData.telugu_name || '-'}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Search Alias (English)</span>
                        <span className="text-xs font-extrabold text-slate-900">{formData.product_name || '-'}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MANUAL ENTRY SECTION OR EDIT FIELDS */}
              {(entryMode === 'manual' || editingProduct) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      {selectedLang === 'te' ? 'తెలుగు పేరు (Telugu Name)' : 'Product Name (English)'}
                    </label>
                    <input
                      type="text"
                      value={selectedLang === 'te' ? formData.telugu_name : formData.product_name}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (selectedLang === 'te') {
                          setFormData({ ...formData, telugu_name: val });
                          handleTeluguVoiceInput(val);
                        } else {
                          handleProductNameChange(e);
                        }
                      }}
                      placeholder={selectedLang === 'te' ? 'చికెన్ మసాలా' : 'Chicken Masala'}
                      className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      {selectedLang === 'te' ? 'ఇంగ్లీష్ పేరు (Search Alias)' : 'Telugu Alias (ఆటో-జనరేటెడ్)'}
                    </label>
                    <input
                      type="text"
                      value={selectedLang === 'te' ? formData.product_name : formData.telugu_name}
                      onChange={(e) => {
                        if (selectedLang === 'te') {
                          setFormData({ ...formData, product_name: e.target.value });
                        } else {
                          setFormData({ ...formData, telugu_name: e.target.value });
                        }
                      }}
                      placeholder={selectedLang === 'te' ? 'Chicken Masala' : 'చికెన్ మసాలా'}
                      className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-semibold text-slate-700"
                    />
                  </div>
                </div>
              )}

              {/* BILINGUAL DROPDOWNS: CATEGORY & UNIT */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    {selectedLang === 'te' ? 'కేటగిరీ (Category) *' : 'Category *'}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>
                        {selectedLang === 'te' ? c.labelTe : c.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    {selectedLang === 'te' ? 'కొలత యూనిట్ (Unit) *' : 'Unit *'}
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    {units.map((u) => (
                      <option key={u.value} value={u.value}>
                        {selectedLang === 'te' ? u.labelTe : u.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* NUMERIC PRICING & STOCK FIELDS */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    {selectedLang === 'te' ? 'అమ్మకం ధర (₹) *' : 'Price (₹) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="50"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-mono font-extrabold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    {selectedLang === 'te' ? 'GST %' : 'GST %'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.gst_percentage}
                    onChange={(e) => setFormData({ ...formData, gst_percentage: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    {selectedLang === 'te' ? 'సరుకు నిల్వ' : 'Initial Stock'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  {selectedLang === 'te' ? 'రద్దు చేయి (Cancel)' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500"
                >
                  {selectedLang === 'te' ? 'భద్రపరచు (Save Product)' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

