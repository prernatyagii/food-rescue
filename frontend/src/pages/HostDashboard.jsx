import React, { useEffect, useState } from "react";
import api from "../api/axios";
import DonationCard from "../components/DonationCard";
import RoleBanner from "../components/RoleBanner";

const emptyForm = { foodType: "", quantity: "", description: "", estimatedWeightKg: 5, hoursValid: 4 };

const HostDashboard = () => {
  const [donations, setDonations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [coords, setCoords] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadMine = async () => {
    const res = await api.get("/donations/mine");
    setDonations(res.data.donations);
  };

  useEffect(() => {
    loadMine();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) return setError("Geolocation not supported by this browser");
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("Could not get your location — please allow location access")
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!coords) return setError("Please detect your location first");

    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("lat", coords.lat);
      fd.append("lng", coords.lng);
      if (photo) fd.append("photo", photo);

      const res = await api.post("/donations", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMessage(`Posted! ${res.data.notifiedNgoCount} nearby verified NGO(s) notified in real time.`);
      setForm(emptyForm);
      setPhoto(null);
      loadMine();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post donation");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <RoleBanner
        role="host"
        icon="🍲"
        title="Post surplus food"
        caption="Every plate you save finds a place at someone's table."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={submit} className="card-premium p-6 space-y-4 lg:col-span-1 h-fit">
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md">{error}</div>}
          {message && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md">{message}</div>}

          <div>
            <label className="text-sm text-gray-600">Food type</label>
            <input required placeholder="e.g. Veg Thali, Sandwiches" className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
              value={form.foodType} onChange={(e) => setForm({ ...form, foodType: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Quantity</label>
            <input required placeholder="e.g. 40 plates / 15 kg" className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
              value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Estimated weight (kg) — for impact tracking</label>
            <input type="number" min="1" className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
              value={form.estimatedWeightKg} onChange={(e) => setForm({ ...form, estimatedWeightKg: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Description (optional)</label>
            <textarea className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2" rows={2}
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Valid for (hours)</label>
            <input type="number" min="1" className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
              value={form.hoursValid} onChange={(e) => setForm({ ...form, hoursValid: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Photo</label>
            <input type="file" accept="image/*" className="w-full mt-1 text-sm" onChange={(e) => setPhoto(e.target.files[0])} />
          </div>

          <button type="button" onClick={detectLocation}
            className="text-sm text-brand-700 border border-brand-200 bg-brand-50 rounded-md px-3 py-2 w-full">
            📍 {coords ? `Location set (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})` : "Detect my location"}
          </button>

          <button disabled={busy} className="btn-primary w-full">
            {busy ? "Posting..." : "Post donation"}
          </button>
        </form>

        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Your donations ({donations.length})</h2>
          {donations.length === 0 ? (
            <p className="text-gray-500 text-sm">You haven't posted any donations yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {donations.map((d) => (
                <DonationCard key={d._id} donation={d} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;
