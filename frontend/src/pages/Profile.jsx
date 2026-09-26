import React, { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.location?.address || "",
    lat: user?.location?.coordinates?.[1] || "",
    lng: user?.location?.coordinates?.[0] || "",
    orgName: user?.ngoDetails?.orgName || "",
    registrationNumber: user?.ngoDetails?.registrationNumber || "",
  });

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const useMyLocation = () => {
    setMessage("");
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));

        setMessage("Location detected. Now click Save changes.");
      },
      () => {
        setError(
          "Unable to detect your location. Please allow location permission."
        );
      }
    );
  };

  const submit = async (e) => {
    e.preventDefault();

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const res = await api.put("/auth/me", form);

      setUser(res.data.user);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const hasLocation =
    form.lat !== "" &&
    form.lng !== "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-orange-500 text-white flex items-center justify-center text-xl font-bold">
          {initials}
        </div>

        <div>
          <h1 className="text-2xl font-bold">Manage Profile</h1>

          <p className="text-gray-500 text-sm capitalize">
            {user.role} account · {user.email}
          </p>
        </div>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md mb-4">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={submit}
        className="card-premium p-6 space-y-4"
      >

        <div>
          <label className="text-sm text-gray-600">
            {user.role === "ngo"
              ? "Contact person name"
              : "Full name"}
          </label>

          <input
            className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">
            Phone
          </label>

          <input
            className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2"
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">
            Address
          </label>

          <input
            className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2"
            value={form.address}
            onChange={(e) =>
              setForm({
                ...form,
                address: e.target.value,
              })
            }
            placeholder="e.g. Adajan, Surat"
          />
        </div>

        {user.role === "ngo" && (
          <>
            <div>
              <label className="text-sm text-gray-600">
                Organisation name
              </label>

              <input
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2"
                value={form.orgName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    orgName: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Registration number
              </label>

              <input
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2"
                value={form.registrationNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    registrationNumber: e.target.value,
                  })
                }
              />
            </div>
          </>
        )}

        {/* LOCATION SECTION */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">

          <p className="text-sm font-medium text-gray-700 mb-3">
            Location
          </p>

          <button
            type="button"
            onClick={useMyLocation}
            className="text-sm text-brand-700 border border-brand-200 bg-brand-50 rounded-md px-3 py-2 w-full"
          >
            {hasLocation
              ? `Location detected (${Number(form.lat).toFixed(5)}, ${Number(form.lng).toFixed(5)})`
              : "Use my current location"}
          </button>

          {hasLocation && (
            <p className="text-xs text-gray-500 mt-2">
              Location coordinates are ready. Click "Save changes"
              to update your profile.
            </p>
          )}

        </div>

        <div className="text-xs text-gray-400">
          Email can't be changed here. Account status:{" "}
          {user.isVerified ? (
            <span className="text-green-600 font-medium">
              Verified
            </span>
          ) : (
            <span className="text-amber-600 font-medium">
              Pending admin verification
            </span>
          )}
        </div>

        <button
          disabled={busy}
          className="btn-primary"
        >
          {busy ? "Saving..." : "Save changes"}
        </button>

      </form>
    </div>
  );
};

export default Profile;
