import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import api from "../api/axios";
import { getSocket } from "../api/socket";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

// Default Leaflet marker icons don't load correctly with bundlers unless
// re-pointed at the CDN — this is the standard workaround.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const steps = ["pending", "accepted", "assigned", "picked_up", "delivered"];

// Shown once a donation is delivered, letting each participant rate the
// others involved (Host <-> NGO <-> Volunteer).
const FeedbackPanel = ({ donation }) => {
  const { user } = useAuth();
  const [alreadyGiven, setAlreadyGiven] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const participants = [
    { id: donation.host?._id, name: donation.host?.name, label: "Host" },
    { id: donation.ngo?._id, name: donation.ngo?.name, label: "NGO" },
    { id: donation.volunteer?._id, name: donation.volunteer?.name, label: "Volunteer" },
  ].filter((p) => p.id && p.id !== user?._id);

  useEffect(() => {
    api.get(`/feedback/donation/${donation._id}`).then((res) => {
      setAlreadyGiven(res.data.feedback.map((f) => f.to));
      if (participants.length) setTarget(participants[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donation._id]);

  if (!user || participants.length === 0) return null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await api.post("/feedback", { donationId: donation._id, to: target, rating, comment });
      setAlreadyGiven((a) => [...a, target]);
      setMessage("Thanks for the feedback!");
      setComment("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setBusy(false);
    }
  };

  const remaining = participants.filter((p) => !alreadyGiven.includes(p.id));
  if (remaining.length === 0) {
    return (
      <div className="card-premium p-5 mt-6 text-sm text-gray-500">
        You've already shared feedback for this donation. Thank you! 🙏
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card-premium p-5 mt-6 space-y-3">
      <h3 className="font-semibold">Leave feedback</h3>
      {message && <p className="text-sm text-brand-700">{message}</p>}
      <div>
        <label className="text-sm text-gray-600">About</label>
        <select className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={target} onChange={(e) => setTarget(e.target.value)}>
          {remaining.map((p) => (
            <option key={p.id} value={p.id}>{p.label} — {p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm text-gray-600">Rating</label>
        <div className="flex gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} onClick={() => setRating(n)} className="text-xl">
              {n <= rating ? "⭐" : "☆"}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm text-gray-600">Comment (optional)</label>
        <textarea className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2}
          value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      <button disabled={busy} className="btn-primary !py-2 text-sm">
        {busy ? "Submitting..." : "Submit feedback"}
      </button>
    </form>
  );
};

const TrackDonation = () => {
  const { id } = useParams();
  const [donation, setDonation] = useState(null);
  const [volunteerPos, setVolunteerPos] = useState(null);

  useEffect(() => {
    api.get(`/donations/${id}`).then((res) => {
      setDonation(res.data.donation);
      const coords = res.data.donation.volunteerLocation?.coordinates;
      if (coords && (coords[0] !== 0 || coords[1] !== 0)) setVolunteerPos([coords[1], coords[0]]);
    });

    const socket = getSocket();
    socket.emit("watch_donation", id);
    socket.on("volunteer_location", (loc) => {
      setVolunteerPos([loc.coordinates[1], loc.coordinates[0]]);
    });
    return () => {
      socket.emit("unwatch_donation", id);
      socket.off("volunteer_location");
    };
  }, [id]);

  if (!donation) return <div className="p-10 text-center text-gray-400">Loading...</div>;

  const stepIndex = steps.indexOf(donation.status);
  const [lng, lat] = donation.location.coordinates;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{donation.foodType}</h1>
        <StatusBadge status={donation.status} />
      </div>

      {/* Progress tracker */}
      <div className="flex items-center mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex flex-col items-center ${i <= stepIndex ? "text-brand-700" : "text-gray-300"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${i <= stepIndex ? "bg-brand-600 border-brand-600 text-white" : "border-gray-300"}`}>
                {i + 1}
              </div>
              <span className="text-[11px] mt-1 capitalize">{s.replace("_", " ")}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < stepIndex ? "bg-brand-600" : "bg-gray-200"}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm space-y-1">
          <p><span className="text-gray-400">Quantity:</span> {donation.quantity}</p>
          <p><span className="text-gray-400">Host:</span> {donation.host?.name}</p>
          <p><span className="text-gray-400">NGO:</span> {donation.ngo?.name || "Not yet accepted"}</p>
          <p><span className="text-gray-400">Volunteer:</span> {donation.volunteer?.name || "Not yet assigned"}</p>
          {donation.otp && <p><span className="text-gray-400">Pickup OTP:</span> <span className="font-mono font-bold">{donation.otp}</span></p>}
        </div>
        {donation.photoUrl && (
          <img src={donation.photoUrl} alt={donation.foodType} className="w-full h-40 object-cover rounded-xl border border-gray-200" />
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ height: 350 }}>
        <MapContainer center={[lat, lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]}>
            <Popup>Pickup location: {donation.location.address || "Host"}</Popup>
          </Marker>
          {volunteerPos && (
            <Marker position={volunteerPos}>
              <Popup>Volunteer's live location</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {donation.status === "delivered" && <FeedbackPanel donation={donation} />}
    </div>
  );
};

export default TrackDonation;
