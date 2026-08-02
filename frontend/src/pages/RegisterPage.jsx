import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Mail, Phone, Lock, FileText, MapPin, ArrowRight, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shop_owner_name: '',
    shop_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    gst_number: '',
    shop_address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      await register({
        shop_owner_name: formData.shop_owner_name,
        shop_name: formData.shop_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        gst_number: formData.gst_number || null,
        shop_address: formData.shop_address || null
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="max-w-xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 my-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Register Vendor Store</h1>
          <p className="text-xs text-slate-400 mt-1">Join VendorGPT AI Billing Network</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Owner Name *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <input
                  type="text"
                  required
                  name="shop_owner_name"
                  value={formData.shop_owner_name}
                  onChange={handleChange}
                  placeholder="Srikanth Reddy"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 pl-9 pr-3 text-xs focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Shop Name *</label>
              <div className="relative">
                <Store className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <input
                  type="text"
                  required
                  name="shop_name"
                  value={formData.shop_name}
                  onChange={handleChange}
                  placeholder="Sri Venkateswara Kirana"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 pl-9 pr-3 text-xs focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="owner@kirana.com"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 pl-9 pr-3 text-xs focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Phone *</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <input
                  type="text"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 pl-9 pr-3 text-xs focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <input
                  type="password"
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 pl-9 pr-3 text-xs focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <input
                  type="password"
                  required
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 pl-9 pr-3 text-xs focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">GST Number (Optional)</label>
              <input
                type="text"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                placeholder="36AAAAA0000A1Z5"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 px-3 text-xs focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Shop Address (Optional)</label>
              <input
                type="text"
                name="shop_address"
                value={formData.shop_address}
                onChange={handleChange}
                placeholder="Main Road, Warangal"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 px-3 text-xs focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all mt-4"
          >
            {loading ? 'Creating Vendor Account...' : (
              <>
                <span>Register Store</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          <span>Already registered? </span>
          <Link to="/login" className="text-emerald-400 font-bold hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
