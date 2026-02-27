import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, fetchMe } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      country: user?.address?.country || 'India',
      pincode: user?.address?.pincode || '',
    }
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/api/auth/profile', form);
      await fetchMe();
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="section-title mb-8">My Profile</h1>

      <div className="bg-white border border-stone-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-craft-500 flex items-center justify-center text-white font-display text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-display text-lg text-ink-900">{user?.name}</p>
            <p className="font-body text-sm text-stone-500">{user?.email}</p>
            <span className="label-sm capitalize">{user?.role}</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label-sm block mb-1.5">Full Name</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label-sm block mb-1.5">Phone</label>
            <input className="input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label-sm block mb-1.5">Avatar URL</label>
            <input className="input" value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} placeholder="https://..." />
          </div>

          <div className="border-t border-stone-200 pt-4">
            <p className="label-sm mb-3">Default Address</p>
            <div className="space-y-3">
              <input className="input" placeholder="Street address" value={form.address.street}
                onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="City" value={form.address.city}
                  onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
                <input className="input" placeholder="State" value={form.address.state}
                  onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="Pincode" value={form.address.pincode}
                  onChange={e => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })} />
                <input className="input" placeholder="Country" value={form.address.country}
                  onChange={e => setForm({ ...form, address: { ...form.address, country: e.target.value } })} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
