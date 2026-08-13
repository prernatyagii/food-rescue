import React, { useEffect, useState } from "react";
import api from "../api/axios";
import StatusBadge from "../components/StatusBadge";
import RoleBanner from "../components/RoleBanner";

const AdminDashboard = () => {
  const [pending, setPending] = useState([]);
  const [donations, setDonations] = useState([]);
  const [tab, setTab] = useState("verifications");

  const load = async () => {
    const [p, d] = await Promise.all([api.get("/admin/pending-verifications"), api.get("/admin/donations")]);
    setPending(p.data.users);
    setDonations(d.data.donations);
  };

  useEffect(() => {
    load();
  }, []);

  const verify = async (userId) => {
    await api.put(`/admin/verify/${userId}`);
    load();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <RoleBanner
        role="admin"
        icon="🛡️"
        title="Admin dashboard"
        caption="Keeping every hand-off honest, verified, and on track."
      />

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("verifications")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "verifications" ? "btn-primary" : "btn-secondary"}`}>
          Pending verifications ({pending.length})
        </button>
        <button onClick={() => setTab("donations")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "donations" ? "btn-primary" : "btn-secondary"}`}>
          All donations ({donations.length})
        </button>
      </div>

      {tab === "verifications" && (
        <div className="card-premium overflow-hidden">
          {pending.length === 0 ? (
            <p className="p-6 text-gray-500 text-sm">Nothing pending — all NGOs and volunteers are verified.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Details</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((u) => (
                  <tr key={u._id} className="border-t border-gray-100">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3 capitalize">{u.role}</td>
                    <td className="p-3 text-gray-500">{u.email} · {u.phone}</td>
                    <td className="p-3 text-gray-500">
                      {u.role === "ngo" ? `${u.ngoDetails?.orgName || ""} (${u.ngoDetails?.registrationNumber || "-"})` : "—"}
                    </td>
                    <td className="p-3">
                      <button onClick={() => verify(u._id)} className="btn-primary !px-3 !py-1.5 text-sm">
                        Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "donations" && (
        <div className="card-premium overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="p-3">Food</th>
                <th className="p-3">Host</th>
                <th className="p-3">NGO</th>
                <th className="p-3">Volunteer</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d._id} className="border-t border-gray-100">
                  <td className="p-3">{d.foodType} ({d.quantity})</td>
                  <td className="p-3 text-gray-500">{d.host?.name}</td>
                  <td className="p-3 text-gray-500">{d.ngo?.name || "—"}</td>
                  <td className="p-3 text-gray-500">{d.volunteer?.name || "—"}</td>
                  <td className="p-3"><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
