import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../api/axios";
import DonationCard from "../components/DonationCard";
import RoleBanner from "../components/RoleBanner";

const VolunteerDashboard = () => {
  const [assignments, setAssignments] =
    useState([]);

  const [otpInput, setOtpInput] =
    useState({});

  const [confirmedAssignments, setConfirmedAssignments] =
    useState({});

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const watchRef =
    useRef(null);

  const load = async () => {
    const res =
      await api.get(
        "/donations/mine"
      );

    const donations =
      res.data.donations || [];

    setAssignments(
      donations
    );

    return donations;
  };

  useEffect(() => {
    load();

    // Share live location for assigned donations
    if (
      navigator.geolocation
    ) {
      watchRef.current =
        navigator.geolocation.watchPosition(
          (pos) => {
            api
              .get(
                "/donations/mine"
              )
              .then((res) => {
                res.data.donations
                  .filter(
                    (d) =>
                      d.status ===
                      "assigned"
                  )
                  .forEach((d) =>
                    api.put(
                      `/donations/${d._id}/location`,
                      {
                        lat:
                          pos.coords
                            .latitude,

                        lng:
                          pos.coords
                            .longitude,
                      }
                    )
                  );
              })
              .catch(() => {});
          }
        );
    }

    return () => {
      if (
        watchRef.current
      ) {
        navigator.geolocation.clearWatch(
          watchRef.current
        );
      }
    };
  }, []);

  // ==================================================
  // VOLUNTEER CONFIRMS ASSIGNMENT
  // HOST GETS OTP
  // ==================================================
  const confirmAssignment =
    async (id) => {
      setError("");
      setMessage("");

      try {
        await api.put(
          `/donations/${id}/confirm-assignment`
        );

        setConfirmedAssignments(
          (prev) => ({
            ...prev,
            [id]: true,
          })
        );

        setMessage(
          "Assignment confirmed! Pickup OTP has been sent to the host."
        );

        await load();
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Failed to confirm assignment"
        );
      }
    };

  // ==================================================
  // VOLUNTEER ENTERS OTP
  // ==================================================
  const verifyPickup =
    async (id) => {
      setError("");
      setMessage("");

      const otp =
        otpInput[id];

      if (!otp) {
        return setError(
          "Ask the host for the pickup OTP"
        );
      }

      try {
        await api.put(
          `/donations/${id}/verify-pickup`,
          {
            otp,
          }
        );

        setMessage(
          "Pickup verified! Food is now on the way to the NGO."
        );

        await load();
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Invalid OTP"
        );
      }
    };

  // ==================================================
  // VOLUNTEER DELIVERS FOOD
  // ==================================================
  const deliver =
    async (id) => {
      setError("");
      setMessage("");

      try {
        await api.put(
          `/donations/${id}/deliver`
        );

        setMessage(
          "Donation delivered successfully! Host has been notified."
        );

        await load();
      } catch (err) {
        try {
          const donations =
            await load();

          const currentDonation =
            donations.find(
              (d) =>
                d._id === id
            );

          if (
            currentDonation?.status ===
            "delivered"
          ) {
            setError("");

            setMessage(
              "Donation delivered successfully! Host has been notified."
            );

            return;
          }
        } catch (
          refreshError
        ) {
          // Ignore refresh error
        }

        setError(
          err.response?.data
            ?.message ||
            "Failed to mark delivered"
        );
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

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md mb-4">
          {message}
        </div>
      )}

      {assignments.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No assignments yet — an NGO will assign you to a donation.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {assignments.map(
            (d) => (
              <DonationCard
                key={d._id}
                donation={d}
              >

                {/* =====================================
                    ASSIGNED
                    ===================================== */}
                {d.status ===
                  "assigned" && (
                  <div className="space-y-3">

                    {/* Assignment details */}
                    <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">

                      <p className="font-semibold text-green-800 mb-2">
                        Food Pickup & Delivery
                      </p>

                      <p>
                        <b>Pickup:</b>{" "}
                        {d.location?.address ||
                          "Host pickup location"}
                      </p>

                      <p>
                        <b>Food:</b>{" "}
                        {d.foodType}
                      </p>

                      <p>
                        <b>Quantity:</b>{" "}
                        {d.quantity}
                      </p>

                      <p className="mt-2">
                        <b>Deliver to:</b>{" "}
                        {d.ngo?.ngoDetails
                          ?.orgName ||
                          d.ngo?.name ||
                          "Assigned NGO"}
                      </p>

                    </div>

                    {/* Confirm assignment */}
                    {!confirmedAssignments[
                      d._id
                    ] && (
                      <button
                        onClick={() =>
                          confirmAssignment(
                            d._id
                          )
                        }
                        className="btn-primary !px-3 !py-1.5 text-sm w-full"
                      >
                        Confirm Assignment
                      </button>
                    )}

                    {/* OTP */}
                    {confirmedAssignments[
                      d._id
                    ] && (
                      <div className="flex items-center gap-2">

                        <input
                          placeholder="OTP"
                          className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm"
                          value={
                            otpInput[
                              d._id
                            ] || ""
                          }
                          onChange={(
                            e
                          ) =>
                            setOtpInput(
                              {
                                ...otpInput,
                                [d._id]:
                                  e.target.value,
                              }
                            )
                          }
                        />

                        <button
                          onClick={() =>
                            verifyPickup(
                              d._id
                            )
                          }
                          className="btn-primary !px-3 !py-1.5 text-sm"
                        >
                          Confirm Pickup
                        </button>

                      </div>
                    )}

                  </div>
                )}

                {/* =====================================
                    PICKED UP
                    ===================================== */}
                {d.status ===
                  "picked_up" && (
                  <button
                    onClick={() =>
                      deliver(
                        d._id
                      )
                    }
                    className="btn-primary !px-3 !py-1.5 text-sm"
                  >
                    Mark Delivered
                  </button>
                )}

              </DonationCard>
            )
          )}

        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;