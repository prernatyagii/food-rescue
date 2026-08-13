import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BackgroundPattern from "../components/BackgroundPattern";
import Logo from "../components/Logo";

const roleHome = { host: "/host", ngo: "/ngo", volunteer: "/volunteer" };

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "host",
    orgName: "",
    registrationNumber: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await register(form);
      navigate(roleHome[user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-green-50 py-10">
      <BackgroundPattern tint="#F97316" icon="leaf" density={12} />
      <div className="relative max-w-md w-full mx-auto card-premium p-8">
        <div className="flex justify-center mb-4"><Logo size={40} /></div>
        <h1 className="text-2xl font-bold mb-1 text-center">Create your account</h1>
      <p className="text-gray-500 text-sm mb-6 text-center italic">Join Food Rescue as a Host, NGO, or Volunteer</p>

      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md mb-4">{error}</div>}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-600">I am a...</label>
          <select
            className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="host">Host (restaurant / event / individual with surplus food)</option>
            <option value="ngo">NGO / Shelter</option>
            <option value="volunteer">Volunteer (pickup & delivery)</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">Full name</label>
          <input required className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        {form.role === "ngo" && (
          <>
            <div>
              <label className="text-sm text-gray-600">Organisation name</label>
              <input required className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Registration number</label>
              <input required className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
            </div>
          </>
        )}

        <div>
          <label className="text-sm text-gray-600">Email</label>
          <input type="email" required className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Phone</label>
          <input required className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Password</label>
          <input type="password" required minLength={6} className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>

        <div>
          <label className="text-sm text-gray-600">Address (optional label)</label>
          <input className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
            value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. Adajan, Surat" />
        </div>

        <button type="button" onClick={useMyLocation}
          className="text-sm text-brand-700 border border-brand-200 bg-brand-50 rounded-md px-3 py-2 w-full">
          📍 {form.lat ? `Location set (${form.lat.toFixed(3)}, ${form.lng.toFixed(3)})` : "Use my current location"}
        </button>

        {(form.role === "ngo" || form.role === "volunteer") && (
          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
            NGO and Volunteer accounts need Admin verification before they can accept or deliver donations.
          </p>
        )}

        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p className="text-sm text-gray-500 mt-4">
        Already have an account? <Link to="/login" className="text-brand-700 font-medium">Log in</Link>
      </p>
      </div>
    </div>
  );
};

export default Register;
