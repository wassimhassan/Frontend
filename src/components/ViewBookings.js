import React, { useState, useEffect } from "react";
import axios from "axios";
import "./viewBookings.css";

const ViewBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("upcoming"); // Filter state: "upcoming", "past", "all"
  const token = localStorage.getItem("token");

  // Fetch client bookings when component mounts
  useEffect(() => {
    fetchBookings();
  }, []);

  // ✅ Fetch Client's Scheduled Bookings
  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/booking/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookings(response.data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cancel Booking with confirmation
  const cancelBooking = async (bookingId) => {
    // Add confirmation before canceling
    if (!window.confirm("Are you sure you want to cancel this session?")) {
      return;
    }

    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/booking/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove the canceled booking from state
      setBookings(bookings.filter((booking) => booking._id !== bookingId));
      // Use a more subtle notification instead of alert
      const notification = document.createElement("div");
      notification.className = "vb-notification success";
      notification.textContent = "Session canceled successfully!";
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (error) {
      console.error("Error canceling booking:", error);
      // Show error notification
      const notification = document.createElement("div");
      notification.className = "vb-notification error";
      notification.textContent = "Failed to cancel session.";
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }
  };

  // ✅ Filter bookings based on date
  const getFilteredBookings = () => {
    const now = new Date();
    
    if (filter === "upcoming") {
      return bookings.filter(booking => new Date(booking.sessionTime) >= now);
    } else if (filter === "past") {
      return bookings.filter(booking => new Date(booking.sessionTime) < now);
    }
    return bookings; // "all" filter
  };

  // Format date in a more readable way
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time in 12-hour format
  const formatTime = (dateString) => {
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  // Calculate time until session
  const getTimeUntilSession = (sessionTime) => {
    const now = new Date();
    const sessionDate = new Date(sessionTime);
    const timeDiff = sessionDate - now;
    
    // Session already passed
    if (timeDiff < 0) return "Session has passed";
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} from now`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} from now`;
    } else {
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes} minute${minutes > 1 ? 's' : ''} from now`;
    }
  };

  const filteredBookings = getFilteredBookings();

  return (
    <div className="vb-container">
      <div className="vb-header">
        <h2 className="vb-title">Your Scheduled Sessions</h2>
        <div className="vb-filter-buttons">
          <button 
            className={`vb-filter-btn ${filter === "upcoming" ? "active" : ""}`}
            onClick={() => setFilter("upcoming")}
          >
            Upcoming
          </button>
          <button 
            className={`vb-filter-btn ${filter === "past" ? "active" : ""}`}
            onClick={() => setFilter("past")}
          >
            Past
          </button>
          <button 
            className={`vb-filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
        </div>
      </div>

      {/* ✅ Show loading state */}
      {loading && <p className="vb-loading">Loading bookings...</p>}

      {/* ✅ Show error message */}
      {error && <p className="vb-error">{error}</p>}

      {/* ✅ Show bookings */}
      {!loading && filteredBookings.length === 0 ? (
        <p className="vb-no-bookings">
          {filter === "upcoming" 
            ? "You have no upcoming sessions." 
            : filter === "past" 
              ? "You have no past sessions." 
              : "You have no bookings."}
        </p>
      ) : (
        <div className="vb-bookings-list">
          {filteredBookings.map((booking) => {
            const sessionDate = new Date(booking.sessionTime);
            const isPast = sessionDate < new Date();
            
            return (
              <div key={booking._id} className={`vb-booking-card ${isPast ? 'past' : ''}`}>
                <div className="vb-booking-header">
                  <h3>{booking.trainerId.username}</h3>
                  {!isPast && (
                    <span className="vb-time-badge">
                      {getTimeUntilSession(booking.sessionTime)}
                    </span>
                  )}
                </div>
                <div className="vb-booking-details">
                  <p><strong>Specialties:</strong> {booking.trainerId.specialties.join(", ")}</p>
                  <p><strong>Date:</strong> {formatDate(booking.sessionTime)}</p>
                  <p><strong>Time:</strong> {formatTime(booking.sessionTime)}</p>
                </div>
                {!isPast && (
                  <button className="vb-cancel-btn" onClick={() => cancelBooking(booking._id)}>
                    Cancel Session
                  </button>
                )}
                {isPast && (
                  <div className="vb-past-session">
                    <span>Session Completed</span>
                    <button className="vb-feedback-btn">Leave Feedback</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ViewBookings;