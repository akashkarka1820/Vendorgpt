import React, { useState, useContext, useEffect } from 'react';
import { Settings as SettingsIcon, Store, User, Phone, Save, Sliders, CheckCircle, QrCode } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function SettingsPage() {
  const { user, updateUser } = useContext(AuthContext);
  const [shopName, setShopName] = useState(user?.shop_name || 'Sri Venkateswara Kirana');
  const [ownerName, setOwnerName] = useState(user?.shop_owner_name || 'Srikanth Reddy');
  const [phone, setPhone] = useState(user?.phone || '9346009164');
  const [gstin, setGstin] = useState(user?.gst_number || '36AAAAA0000A1Z5');
  const [address, setAddress] = useState(user?.shop_address || 'Main Road, Hanamkonda, Warangal');
  
  // UPI Payment Settings
  const [upiId, setUpiId] = useState(user?.upi_id || 'akashkarka@ybl');
  const [upiPhone, setUpiPhone] = useState(user?.upi_phone || '9346009164');

  const [highThreshold, setHighThreshold] = useState(85);
  const [medThreshold, setMedThreshold] = useState(60);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setShopName(user.shop_name || 'Sri Venkateswara Kirana');
      setOwnerName(user.shop_owner_name || 'Srikanth Reddy');
      setPhone(user.phone || '9346009164');
      setGstin(user.gst_number || '36AAAAA0000A1Z5');
      setAddress(user.shop_address || 'Main Road, Hanamkonda, Warangal');
      setUpiId(user.upi_id || 'akashkarka@ybl');
      setUpiPhone(user.upi_phone || '9346009164');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (updateUser) {
        await updateUser({
          shop_name: shopName,
          shop_owner_name: ownerName,
          phone: phone,
          gst_number: gstin,
          shop_address: address,
          upi_id: upiId,
          upi_phone: upiPhone
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Store & System Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure Kirana store invoice header, UPI payment parameters & Voice AI matching</p>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle size={18} />
          <span>Settings saved successfully! Dynamic UPI QR updated.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Store size={18} className="text-emerald-600" />
            <span>Store Profile & Invoice Header</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">Shop Name</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl p-3 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">Owner Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl p-3 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl p-3 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">GSTIN Number</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl p-3 font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-500 uppercase mb-1">Shop Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl p-3 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* UPI Dynamic QR Payment Settings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <QrCode size={18} className="text-emerald-600" />
            <span>UPI QR Payment Configuration</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">UPI VPA / ID (Payee VPA) *</label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="akashkarka@ybl"
                className="w-full bg-slate-50 border rounded-xl p-3 font-mono font-bold text-emerald-700"
              />
              <p className="text-[11px] text-slate-400 mt-1">Direct payee address (e.g. akashkarka@ybl or 9346009164@ybl)</p>
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">Merchant Phone Number</label>
              <input
                type="text"
                value={upiPhone}
                onChange={(e) => setUpiPhone(e.target.value)}
                placeholder="9346009164"
                className="w-full bg-slate-50 border rounded-xl p-3 font-mono font-semibold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Vendor support phone associated with UPI account</p>
            </div>
          </div>
        </div>

        {/* AI & Fuzzy Matching Settings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders size={18} className="text-emerald-600" />
            <span>Voice AI & RapidFuzz Match Settings</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>High Confidence Auto-Add Threshold</span>
                <span className="font-mono text-emerald-600">{highThreshold}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="95"
                value={highThreshold}
                onChange={(e) => setHighThreshold(e.target.value)}
                className="w-full accent-emerald-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">Predictions above this percentage automatically add items to the cart.</p>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Medium Confidence Suggestion Threshold</span>
                <span className="font-mono text-amber-600">{medThreshold}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="75"
                value={medThreshold}
                onChange={(e) => setMedThreshold(e.target.value)}
                className="w-full accent-amber-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">Predictions between this and high threshold prompt vendor confirmation.</p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2"
        >
          <Save size={16} /> Save Configuration
        </button>
      </form>
    </div>
  );
}
