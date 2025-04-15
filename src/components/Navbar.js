import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ Read user role & token from localStorage
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || "");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userId, setUserId] = useState(localStorage.getItem("clientId") || "");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // ✅ Ensure role updates properly
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedToken = localStorage.getItem("token");
    const storedClientId = localStorage.getItem("clientId");

    if (!storedToken) {
      navigate("/login");
    } else {
      setUserRole(storedRole);
      setToken(storedToken);
      setUserId(storedClientId);
    }
    
    // Close menu when changing routes
    setIsMenuOpen(false);
  }, [navigate, location.pathname]);

  // ✅ Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // ✅ Check if link is active
  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  // ✅ Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("trainerId");
    localStorage.removeItem("role");
    localStorage.removeItem("clientId");
    setUserRole("");
    setUserId("");
    navigate("/");
  };

  return (
    <nav className="nb-navbar">
      <Link to="/" className="nb-logo">
        {/* SVG gym icon matching the image */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"></path>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        GYM APP
      </Link>

      <button className="nb-mobile-menu-btn" onClick={toggleMenu} aria-label="Toggle menu">
        {isMenuOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        )}
      </button>

      {/* ✅ Navigation Links Based on Role */}
      <div className={`nb-nav-links-container ${isMenuOpen ? 'open' : ''}`}>
        <ul className="nb-nav-links">
          {userRole === "client" && (
            <>
              <li><Link to="/profile" className={`nb-nav-link ${isActive('/profile')}`}>Profile</Link></li>
              <li><Link to="/booking" className={`nb-nav-link ${isActive('/booking')}`}>Book Session</Link></li>
              <li><Link to="/view-bookings" className={`nb-nav-link ${isActive('/view-bookings')}`}>My Bookings</Link></li>
              <li><Link to="/subscribe" className={`nb-nav-link ${isActive('/subscribe')}`}>Subscribe</Link></li>
              <li><Link to="/payment-history" className={`nb-nav-link ${isActive('/payment-history')}`}>Payments</Link></li>
              <li><Link to="/chat" className={`nb-nav-link ${isActive('/chat')}`}>Chat</Link></li>
              <li><Link to="/workout-plan" className={`nb-nav-link ${isActive('/workout-plan')}`}>Workout Plan</Link></li>
              <li><Link to="/aisuggestions" className={`nb-nav-link ${isActive('/aisuggestions')}`}>AI Suggestions</Link></li>
            </>
          )}

          {userRole === "trainer" && (
            <>
              <li><Link to="/profile" className={`nb-nav-link ${isActive('/profile')}`}>Profile</Link></li>
              <li><Link to="/availability" className={`nb-nav-link ${isActive('/availability')}`}>Manage Availability</Link></li>
              <li><Link to="/view-availability" className={`nb-nav-link ${isActive('/view-availability')}`}>View Schedule</Link></li>
              <li><Link to="/chat" className={`nb-nav-link ${isActive('/chat')}`}>Chat</Link></li>
              <li><Link to="/assign-workout" className={`nb-nav-link ${isActive('/assign-workout')}`}>Assign Workout</Link></li>
            </>
          )}

          {userRole === "gymOwner" && (
            <>
              <li><Link to="/gym-owner/dashboard" className={`nb-nav-link ${isActive('/gym-owner/dashboard')}`}>Dashboard</Link></li>
              <li><Link to="/gym-owner/subscriptions" className={`nb-nav-link ${isActive('/gym-owner/subscriptions')}`}>Manage Subscriptions</Link></li> 
              <li><Link to="/gym-owner/unpaid-clients" className={`nb-nav-link ${isActive('/gym-owner/unpaid-clients')}`}>Unpaid Clients</Link></li>
              <li><Link to="/gym-owner/manage-trainers" className={`nb-nav-link ${isActive('/gym-owner/manage-trainers')}`}>Manage Trainers</Link></li>
              <li><Link to="/gym-owner/change-password" className={`nb-nav-link ${isActive('/gym-owner/change-password')}`}>Change Password</Link></li>
            </>
          )}
        </ul>
      </div>

      {/* ✅ Logout Button - bright red matching the image */}
      {token && (
        <div className="nb-buttons-container">
          <button className="nb-logout-btn" onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;