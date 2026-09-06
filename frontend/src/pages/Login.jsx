import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BackgroundPattern from "../components/BackgroundPattern";
import Logo from "../components/Logo";

const roleHome = {
  host: "/host",
  ngo: "/ngo",
  volunteer: "/volunteer",
  admin: "/admin",
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      navigate(roleHome[user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
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
        <h1 className="text-2xl font-bold mb-1 text-center">Welcome back</h1>
        <p className="text-gray-500 text-sm mb-6 text-center italic">
          Every login gets a meal closer to someone who needs it.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
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
          <div>
            <label className="text-sm text-gray-600">Password</label>
            <input
              type="password"
              required
              className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button disabled={busy} className="btn-primary w-full">
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4">
          No account?{" "}
          <Link to="/register" className="text-brand-700 font-medium">
            Sign up
          </Link>
        </p>

        <p className="text-sm text-gray-500 mt-1">
          Forgot password?{" "}
          <Link to="/forgot-password" className="text-brand-700 font-medium">
            Reset it
          </Link>
        </p>

        <div className="mt-6 border-t pt-4 text-xs text-gray-400">
          Demo logins (after running the seed script): <br />
          host@foodrescue.com / host123 · ngo@foodrescue.com / ngo123 <br />
          volunteer@foodrescue.com / volunteer123 · admin@foodrescue.com /
          admin123
        </div>
      </div>
    </div>
  );
};

export default Login;
