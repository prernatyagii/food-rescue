import React from "react";
import BackgroundPattern from "./BackgroundPattern";

// Sits at the top of every role dashboard: a soft gradient card with a
// blended decorative pattern behind it and a short italic caption — the
// per-role "background + caption" treatment, built from CSS/SVG rather
// than stock photography.
const THEMES = {
  host: { from: "from-green-50", to: "to-orange-50", tint: "#16A34A", icon: "bowl" },
  ngo: { from: "from-orange-50", to: "to-amber-50", tint: "#F97316", icon: "heart" },
  volunteer: { from: "from-blue-50", to: "to-emerald-50", tint: "#0EA5E9", icon: "leaf" },
  admin: { from: "from-indigo-50", to: "to-slate-50", tint: "#4F46E5", icon: "bowl" },
};

const RoleBanner = ({ role, title, caption, icon }) => {
  const theme = THEMES[role] || THEMES.host;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.from} ${theme.to} border border-gray-100 mb-8 px-6 py-8 shadow-sm`}
    >
      <BackgroundPattern tint={theme.tint} icon={theme.icon} density={14} />
      <div className="relative">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">{icon}</span>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        <p className="italic text-gray-500 text-sm">{caption}</p>
      </div>
    </div>
  );
};

export default RoleBanner;
