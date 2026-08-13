import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

const roleHome = {
  host: "/host",
  ngo: "/ngo",
  volunteer: "/volunteer",
  admin: "/admin",
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <nav className="bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/">
          <Logo size={32} />
        </Link>

        <div className="flex items-center gap-5 text-sm">
          {user ? (
            <>
              <Link to={roleHome[user.role] || "/"} className="text-gray-600 hover:text-brand-700 font-medium">
                Dashboard
              </Link>
              <Link to="/impact" className="text-gray-600 hover:text-brand-700 font-medium hidden sm:inline">
                Impact
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-sm"
                >
                  {initials}
                </button>
                {open && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-100 shadow-lg py-2 z-40">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{user.role} account</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2 text-gray-600 hover:bg-gray-50"
                    >
                      Manage Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setOpen(false);
                        navigate("/login");
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/impact" className="text-gray-600 hover:text-brand-700 font-medium">
                Impact
              </Link>
              <Link to="/login" className="text-gray-600 hover:text-brand-700 font-medium">
                Login
              </Link>
              <Link to="/register" className="btn-primary !px-4 !py-2 text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
