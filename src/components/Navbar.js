import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  
  // ✅ Read user role & token from localStorage
  const [userRole, setUserRole] = useState(localStorage.getItem("role"));
  const token = localStorage.getItem("token");

  // ✅ When the component mounts, check if the user is logged in
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      setUserRole(localStorage.getItem("role")); // Read role from localStorage
    }
  }, [token, navigate]); // Re-run if token changes

  // ✅ Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    setUserRole(""); // Reset role to guest
    navigate("/");
  };

  return (
    <nav className="nb-navbar">
      <h2 className="nb-logo">Gym App</h2>

      {/* ✅ Navigation Links Based on Role */}
      <ul className="nb-nav-links">
        {userRole === "client" && (
          <>
            <li><Link to="/profile" className="nb-nav-link">Profile</Link></li>
            <li><Link to="/booking" className="nb-nav-link">Book a Session</Link></li>
            <li><Link to="/view-bookings" className="nb-nav-link">View Bookings</Link></li>
            <li><Link to="/chat" className="nb-nav-link">Chat</Link></li>
          </>
        )}

        {userRole === "trainer" && (
          <>
            <li><Link to="/profile" className="nb-nav-link">Profile</Link></li>
            <li><Link to="/availability" className="nb-nav-link">Manage Availability</Link></li>
            <li><Link to="/view-availability" className="nb-nav-link">View Availability</Link></li>
            <li><Link to="/chat" className="nb-nav-link">Chat</Link></li>
          </>
        )}
      </ul>

      {/* ✅ Logout Button for Logged-In Users */}
      {token && (
        <button className="nb-logout-btn" onClick={handleLogout}>Logout</button>
      )}
    </nav>
  );
};

export default Navbar;
