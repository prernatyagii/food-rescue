import React from "react";

const styles = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  assigned: "bg-indigo-100 text-indigo-800",
  picked_up: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
  expired: "bg-red-100 text-red-700",
};

const StatusBadge = ({ status }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>
    {status.replace("_", " ")}
  </span>
);

export default StatusBadge;
