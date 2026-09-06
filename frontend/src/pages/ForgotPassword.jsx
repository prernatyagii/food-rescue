import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import BackgroundPattern from "../components/BackgroundPattern";
import Logo from "../components/Logo";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter otp + new password
  const [form, setForm] = useState({ email: "", otp: "", newPassword: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email: form.email });
      setInfo("OTP sent — check the backend console (mock SMS/notification).");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send OTP");
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/auth/reset-password", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-green-50 via-white to-orange-50 flex items-start justify-center">
      <BackgroundPattern tint="#16A34A" icon="bowl" density={12} />
      <div className="relative max-w-md w-full mx-4 mt-16 card-premium p-8">
        <div className="flex justify-center mb-4">
          <Logo size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-1 text-center">Reset password</h1>
        <p className="text-gray-500 text-sm mb-6 text-center italic">
          {step === 1
            ? "Enter your email to get an OTP."
            : "Enter the OTP and your new password."}
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        {info && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md mb-4">
            {info}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                type="email"
                required
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <button disabled={busy} className="btn-primary w-full">
              {busy ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">OTP</label>
              <input
                required
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                value={form.otp}
                onChange={(e) => setForm({ ...form, otp: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">New Password</label>
              <input
                type="password"
                required
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                value={form.newPassword}
                onChange={(e) =>
                  setForm({ ...form, newPassword: e.target.value })
                }
              />
            </div>
            <button disabled={busy} className="btn-primary w-full">
              {busy ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="text-sm text-gray-500 mt-4 text-center">
          <Link to="/login" className="text-brand-700 font-medium">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
