import React, { useEffect, useState } from "react";
import api from "../api/axios";
import DonationCard from "../components/DonationCard";
import RoleBanner from "../components/RoleBanner";

const emptyForm = {
  category: "",
  foodType: "",
  foodCategory: "",
  quantity: "",
  quantityUnit: "Plates",
  description: "",
  hoursValid: 4,
};

const HostDashboard = () => {
  const [donations, setDonations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [coords, setCoords] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadMine = async () => {
    const res = await api.get("/donations/mine");
    setDonations(res.data.donations);
  };

  useEffect(() => {
    loadMine();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      return setError(
        "Geolocation not supported by this browser"
      );
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () =>
        setError(
          "Could not get your location — please allow location access"
        )
    );
  };

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!coords) {
      return setError("Please detect your location first");
    }

    if (!form.category) {
      return setError("Please select a category");
    }

    if (!form.foodType.trim()) {
      return setError("Please enter food name");
    }

    if (!form.quantity || Number(form.quantity) <= 0) {
      return setError("Please enter a valid quantity");
    }

    if (!form.foodCategory) {
      return setError("Please select Veg or Non-Veg");
    }

    setBusy(true);

    try {
      const fd = new FormData();

      fd.append("category", form.category);
      fd.append("foodType", form.foodType);
      fd.append("foodCategory", form.foodCategory);

      // Backend will receive quantity like:
      // "40 Plates" or "15 Kg"
      fd.append(
        "quantity",
        `${form.quantity} ${form.quantityUnit}`
      );

      fd.append("description", form.description);
      fd.append("hoursValid", form.hoursValid);

      fd.append("lat", coords.lat);
      fd.append("lng", coords.lng);

      // Estimated weight is removed from the UI.
      // If quantity is in Kg, use quantity as estimated weight.
      if (form.quantityUnit === "Kg") {
        fd.append(
          "estimatedWeightKg",
          Number(form.quantity)
        );
      }

      if (photo) {
        fd.append("photo", photo);
      }

      const res = await api.post(
        "/donations",
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(
        `Posted! ${res.data.notifiedNgoCount} nearby verified NGO(s) notified in real time.`
      );

      setForm(emptyForm);
      setPhoto(null);

      loadMine();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to post donation"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <RoleBanner
        role="host"
        icon="🍲"
        title="Post surplus food"
        caption="Every plate you save finds a place at someone's table."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form
          onSubmit={submit}
          className="card-premium p-6 space-y-4 lg:col-span-1 h-fit"
        >
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md">
              {message}
            </div>
          )}

          {/* CATEGORY */}
          <div>
            <label className="text-sm text-gray-600">
              Category
            </label>

            <select
              required
              className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 bg-white"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                })
              }
            >
              <option value="">
                Select category
              </option>

              <option value="Prepared Meals">
                Prepared Meals
              </option>

              <option value="Snacks">
                Snacks
              </option>

              <option value="Rice & Grains">
                Rice & Grains
              </option>

              <option value="Breads">
                Breads
              </option>

              <option value="Fruits">
                Fruits
              </option>

              <option value="Vegetables">
                Vegetables
              </option>

              <option value="Dairy">
                Dairy
              </option>

              <option value="Sweets">
                Sweets
              </option>

              <option value="Beverages">
                Beverages
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          {/* FOOD NAME */}
          <div>
            <label className="text-sm text-gray-600">
              Food Name
            </label>

            <input
              required
              placeholder="e.g. Veg Thali, Sandwiches"
              className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
              value={form.foodType}
              onChange={(e) =>
                setForm({
                  ...form,
                  foodType: e.target.value,
                })
              }
            />
          </div>

          {/* FOOD QUANTITY */}
          <div>
            <label className="text-sm text-gray-600">
              Food Quantity
            </label>

            <div className="flex gap-2 mt-1">
              <input
                required
                type="number"
                min="1"
                placeholder="e.g. 40"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quantity: e.target.value,
                  })
                }
              />

              <select
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
                value={form.quantityUnit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quantityUnit: e.target.value,
                  })
                }
              >
                <option value="Plates">
                  Plates
                </option>

                <option value="Kg">
                  Kg
                </option>
              </select>
            </div>
          </div>

          {/* FOOD TYPE */}
          <div>
            <label className="text-sm text-gray-600">
              Food Type
            </label>

            <select
              required
              className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 bg-white"
              value={form.foodCategory}
              onChange={(e) =>
                setForm({
                  ...form,
                  foodCategory: e.target.value,
                })
              }
            >
              <option value="">
                Select food type
              </option>

              <option value="Veg">
                Veg
              </option>

              <option value="Non-Veg">
                Non-Veg
              </option>
            </select>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-sm text-gray-600">
              Description (optional)
            </label>

            <textarea
              className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
              rows={2}
              placeholder="Add any useful information about the food"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />
          </div>

          {/* VALID FOR */}
          <div>
            <label className="text-sm text-gray-600">
              Valid for
            </label>

            <select
              className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 bg-white"
              value={form.hoursValid}
              onChange={(e) =>
                setForm({
                  ...form,
                  hoursValid: e.target.value,
                })
              }
            >
              <option value="1">
                1 hour
              </option>

              <option value="2">
                2 hours
              </option>

              <option value="4">
                4 hours
              </option>

              <option value="6">
                6 hours
              </option>

              <option value="8">
                8 hours
              </option>

              <option value="12">
                12 hours
              </option>
            </select>
          </div>

          {/* FOOD IMAGE */}
          <div>
            <label className="text-sm text-gray-600">
              Food Image
            </label>

            <input
              type="file"
              accept="image/*"
              className="w-full mt-1 text-sm"
              onChange={(e) =>
                setPhoto(e.target.files[0])
              }
            />
          </div>

          {/* LOCATION */}
          <button
            type="button"
            onClick={detectLocation}
            className="text-sm text-brand-700 border border-brand-200 bg-brand-50 rounded-md px-3 py-2 w-full"
          >
            📍{" "}
            {coords
              ? `Location set (${coords.lat.toFixed(
                  3
                )}, ${coords.lng.toFixed(3)})`
              : "Detect my location"}
          </button>

          {/* POST DONATION */}
          <button
            disabled={busy}
            className="btn-primary w-full"
          >
            {busy
              ? "Posting..."
              : "Post donation"}
          </button>
        </form>

        {/* YOUR DONATIONS */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">
            Your donations ({donations.length})
          </h2>

          {donations.length === 0 ? (
            <p className="text-gray-500 text-sm">
              You haven't posted any donations yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {donations.map((d) => (
                <DonationCard
                  key={d._id}
                  donation={d}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;