import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import api from "../api/axios";
import StatCard from "../components/StatCard";

const STATUS_COLORS = {
  pending: "#facc15",
  accepted: "#3b82f6",
  assigned: "#6366f1",
  picked_up: "#a855f7",
  delivered: "#16a34a",
  cancelled: "#9ca3af",
  expired: "#ef4444",
};

const ImpactDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/stats").then((res) => setStats(res.data));
  }, []);

  if (!stats) return <div className="p-10 text-center text-gray-400">Loading impact data...</div>;

  const pieData = stats.statusBreakdown.map((s) => ({ name: s._id, value: s.count }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Impact dashboard</h1>
      <p className="text-gray-500 text-sm mb-8">Meals saved and food waste reduced, platform-wide.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatCard label="Meals saved" value={stats.mealsSaved} icon="🍽️" />
        <StatCard label="Food waste reduced (kg)" value={stats.foodWasteReducedKg} icon="♻️" />
        <StatCard label="Active NGOs" value={stats.activeNGOs} icon="🏢" />
        <StatCard label="Active volunteers" value={stats.activeVolunteers} icon="🚴" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Deliveries in the last 7 days</h2>
          {stats.trend.length === 0 ? (
            <p className="text-sm text-gray-400">No deliveries in the last 7 days yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="meals" name="Meals delivered" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Donation status breakdown</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-400">No donations posted yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#9ca3af"} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImpactDashboard;
