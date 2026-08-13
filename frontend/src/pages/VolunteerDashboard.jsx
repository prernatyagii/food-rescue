import React, { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import DonationCard from "../components/DonationCard";
import RoleBanner from "../components/RoleBanner";

const VolunteerDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [otpInput, setOtpInput] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const watchRef = useRef(null);

  const load = async () => {
    const res = await api.get("/donations/mine");
    setAssignments(res.data.donations);
  };

  useEffect(() => {
    load();
    // Share live location for any donation currently "assigned" (in transit to pickup)
    if (navigator.geolocation) {
      watchRef.current = navigator.geolocation.watchPosition((pos) => {
        api
          .get("/donations/mine")
          .then((res) => {
            res.data.donations
              .filter((d) => d.status === "assigned")
              .forEach((d) =>
                api.put(`/donations/${d._id}/location`, {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                })
              );
          })
          .catch(() => {});
      });
    }
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  const verifyPickup = async (id) => {
    setError("");
    setMessage("");
    const otp = otpInput[id];
    if (!otp) return setError("Ask the host for the pickup OTP");
    try {
      await api.put(`/donations/${id}/verify-pickup`, { otp });
      setMessage("Pickup verified!");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    }
  };

  const deliver = async (id) => {
    setError("");
    try {
      await api.put(`/donations/${id}/deliver`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark delivered");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <RoleBanner
        role="volunteer"
        icon="🚴"
        title="Volunteer dashboard"
        caption="Every ride carries a little more hope."
      />

      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md mb-4">{error}</div>}
      {message && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md mb-4">{message}</div>}

      {assignments.length === 0 ? (
        <p className="text-gray-500 text-sm">No assignments yet — an NGO will assign you to a donation.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((d) => (
            <DonationCard key={d._id} donation={d}>
              {d.status === "assigned" && (
                <div className="flex items-center gap-2">
                  <input
                    placeholder="OTP"
                    className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm"
                    value={otpInput[d._id] || ""}
                    onChange={(e) => setOtpInput({ ...otpInput, [d._id]: e.target.value })}
                  />
                  <button onClick={() => verifyPickup(d._id)} className="btn-primary !px-3 !py-1.5 text-sm">
                    Confirm pickup
                  </button>
                </div>
              )}
              {d.status === "picked_up" && (
                <button onClick={() => deliver(d._id)} className="btn-primary !px-3 !py-1.5 text-sm">
                  Mark delivered
                </button>
              )}
            </DonationCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
