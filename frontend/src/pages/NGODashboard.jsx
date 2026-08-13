import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { getSocket } from "../api/socket";
import DonationCard from "../components/DonationCard";
import RoleBanner from "../components/RoleBanner";

const NGODashboard = () => {
  const [nearby, setNearby] = useState([]);
  const [mine, setMine] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState({});
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = async () => {
    const [n, m, v] = await Promise.all([
      api.get("/donations/nearby"),
      api.get("/donations/mine"),
      api.get("/donations/volunteers/available"),
    ]);
    setNearby(n.data.donations);
    setMine(m.data.donations);
    setVolunteers(v.data.volunteers);
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.on("notification", (n) => {
      if (n.type === "new_donation_nearby") {
        setToast(n.message);
        load();
      }
    });
    return () => socket.off("notification");
  }, []);

  const accept = async (id) => {
    setError("");
    try {
      await api.put(`/donations/${id}/accept`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to accept");
    }
  };

  const assign = async (id) => {
    const volunteerId = selectedVolunteer[id];
    if (!volunteerId) return setError("Select a volunteer first");
    try {
      await api.put(`/donations/${id}/assign-volunteer`, { volunteerId });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign volunteer");
    }
  };

  const acceptedNeedingVolunteer = mine.filter((d) => d.status === "accepted");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <RoleBanner
        role="ngo"
        icon="🏢"
        title="NGO dashboard"
        caption="Connecting surplus to the people who need it most."
      />

      {toast && <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-md mb-4">🔔 {toast}</div>}
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md mb-4">{error}</div>}

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Nearby pending donations ({nearby.length})</h2>
        {nearby.length === 0 ? (
          <p className="text-gray-500 text-sm">No pending donations nearby right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearby.map((d) => (
              <DonationCard key={d._id} donation={d}>
                <button onClick={() => accept(d._id)} className="btn-primary !px-3 !py-1.5 text-sm">
                  Accept
                </button>
              </DonationCard>
            ))}
          </div>
        )}
      </section>

      {acceptedNeedingVolunteer.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Assign a volunteer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {acceptedNeedingVolunteer.map((d) => (
              <div key={d._id} className="card-premium p-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium">{d.foodType} · {d.quantity}</p>
                  <p className="text-xs text-gray-400">Host: {d.host?.name}</p>
                </div>
                <select
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                  value={selectedVolunteer[d._id] || ""}
                  onChange={(e) => setSelectedVolunteer({ ...selectedVolunteer, [d._id]: e.target.value })}
                >
                  <option value="">Select volunteer</option>
                  {volunteers.map((v) => (
                    <option key={v._id} value={v._id}>{v.name}</option>
                  ))}
                </select>
                <button onClick={() => assign(d._id)} className="btn-primary !px-3 !py-1.5 text-sm">
                  Assign
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">Your claimed donations ({mine.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mine.map((d) => (
            <DonationCard key={d._id} donation={d} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default NGODashboard;
