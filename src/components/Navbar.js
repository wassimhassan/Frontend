import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  
  // ✅ Read user role & token from localStorage
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || "");
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  // ✅ Ensure role updates properly
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      navigate("/login");
    } else {
      setUserRole(storedRole);
      setToken(storedToken);
    }
  }, [navigate]);

  // ✅ Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("trainerId");
    localStorage.removeItem("role");
    setUserRole("");
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
            <li><Link to="/subscribe" className="nb-nav-link">Subscribe</Link></li> {/* Added Subscription Page */}
            <li><Link to="/chat" className="nb-nav-link">Chat</Link></li>
            <li><Link to="/workout-plan" className="nb-nav-link">Workout-Plan</Link></li>
          </>
        )}

        {userRole === "trainer" && (
          <>
            <li><Link to="/profile" className="nb-nav-link">Profile</Link></li>
            <li><Link to="/availability" className="nb-nav-link">Manage Availability</Link></li>
            <li><Link to="/view-availability" className="nb-nav-link">View Availability</Link></li>
            <li><Link to="/chat" className="nb-nav-link">Chat</Link></li>
            <li><Link to="/assign-workout" className="nb-nav-link">Assign Workout</Link></li>
          </>
        )}

{userRole === "gymOwner" && (
  <>
    <li><Link to="/gym-owner/dashboard" className="nb-nav-link">Dashboard</Link></li>
    <li><Link to="/gym-owner/subscriptions" className="nb-nav-link">Manage Subscriptions</Link></li> 
    <li><Link to="/gym-owner/unpaid-clients" className="nb-nav-link">Unpaid Clients</Link></li>
  </>
)}

      </ul>

      {/* ✅ Logout Button */}
      {token && (
        <button className="nb-logout-btn" onClick={handleLogout}>Logout</button>
      )}
    </nav>
  );
};

export default Navbar;
