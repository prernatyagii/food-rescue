import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import BackgroundPattern from "../components/BackgroundPattern";

const roleHome = { host: "/host", ngo: "/ngo", volunteer: "/volunteer", admin: "/admin" };

const Home = () => {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-orange-50">
        <BackgroundPattern tint="#16A34A" icon="leaf" density={16} />
        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="flex justify-center mb-5">
            <Logo size={56} textClass="text-2xl" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">Save Food, Share Hope</h1>
          <p className="italic text-gray-500 max-w-2xl mx-auto mb-8">
            Connecting surplus food from restaurants, events, and households to verified NGOs —
            in under a minute, within a 20–30 km radius, in real time.
          </p>

          {user ? (
            <Link to={roleHome[user.role] || "/"} className="btn-primary inline-block">
              Go to my dashboard →
            </Link>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Link to="/register" className="btn-primary">
                Get started
              </Link>
              <Link to="/login" className="btn-secondary">
                Log in
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-left">
          <div className="card-premium p-6">
            <div className="text-3xl mb-2">📸</div>
            <h3 className="font-semibold mb-1">Host posts surplus food</h3>
            <p className="text-sm text-gray-500">Photo, food details, and auto-detected location — under a minute.</p>
          </div>
          <div className="card-premium p-6">
            <div className="text-3xl mb-2">📡</div>
            <h3 className="font-semibold mb-1">NGOs get matched instantly</h3>
            <p className="text-sm text-gray-500">Verified NGOs within a 20–30 km radius are alerted immediately.</p>
          </div>
          <div className="card-premium p-6">
            <div className="text-3xl mb-2">🚴</div>
            <h3 className="font-semibold mb-1">Volunteer picks up & delivers</h3>
            <p className="text-sm text-gray-500">OTP-verified handover, live tracking all the way to the NGO.</p>
          </div>
          <div className="card-premium p-6">
            <div className="text-3xl mb-2">❤️</div>
            <h3 className="font-semibold mb-1">Meals reach people in need</h3>
            <p className="text-sm text-gray-500">The NGO distributes and logs the impact on the dashboard.</p>
          </div>
        </div>
      </div>

      {/* Why Food Rescue */}
      <div className="relative overflow-hidden bg-gray-50 border-t border-gray-100">
        <BackgroundPattern tint="#F97316" icon="heart" density={10} />
        <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">Why Food Rescue</h2>
          <p className="text-gray-500 max-w-2xl mx-auto mb-10">
            Restaurants and event hosts end up throwing away good food every day, while shelters
            nearby are stretched thin. Food Rescue closes that gap — quickly, safely, and
            transparently, with every handover verified end to end.
          </p>
          <Link to="/impact" className="btn-secondary inline-block">
            See platform impact →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
