import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";


const Navbar = () => {
  return (
    <nav className="navbar">
      <h2 className="logo">Gym App</h2>
      <ul className="nav-links">
        <li><Link to="/chat">Chat</Link></li>
        <li><Link to="/availability">Availability</Link></li>
        <li><Link to="/booking">Booking</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
