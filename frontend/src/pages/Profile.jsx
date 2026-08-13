import React, { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.location?.address || "",
    orgName: user?.ngoDetails?.orgName || "",
    registrationNumber: user?.ngoDetails?.registrationNumber || "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await api.put("/auth/me", form);
      setUser(res.data.user);
      setMessage("Profile updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-orange-500 text-white flex items-center justify-center text-xl font-bold">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold">Manage Profile</h1>
          <p className="text-gray-500 text-sm capitalize">{user.role} account · {user.email}</p>
        </div>
      </div>

      {message && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md mb-4">{message}</div>}
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md mb-4">{error}</div>}

      <form onSubmit={submit} className="card-premium p-6 space-y-4">
        <div>
          <label className="text-sm text-gray-600">{user.role === "ngo" ? "Contact person name" : "Full name"}</label>
          <input className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Phone</label>
          <input className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Address</label>
          <input className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2"
            value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>

        {user.role === "ngo" && (
          <>
            <div>
              <label className="text-sm text-gray-600">Organisation name</label>
              <input className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2"
                value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Registration number</label>
              <input className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2"
                value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
            </div>
          </>
        )}

        <div className="text-xs text-gray-400">
          Email can't be changed here. Account status:{" "}
          {user.isVerified ? (
            <span className="text-green-600 font-medium">Verified</span>
          ) : (
            <span className="text-amber-600 font-medium">Pending admin verification</span>
          )}
        </div>

        <button disabled={busy} className="btn-primary">
          {busy ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
};

export default Profile;
