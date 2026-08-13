import React from "react";

const StatCard = ({ label, value, icon, accent = "brand" }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
    <div className={`w-12 h-12 rounded-lg bg-${accent}-100 flex items-center justify-center text-2xl`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  </div>
);

export default StatCard;
