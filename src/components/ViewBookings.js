import React, { useState, useEffect } from "react";
import axios from "axios";
import "./viewBookings.css"; // Add a CSS file for styling

const ViewBookings = () => {
  const [bookings, setBookings] = useState([]); // Store booked sessions
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(""); // Error handling
  const token = localStorage.getItem("token"); // User authentication token

  // Fetch client bookings when component mounts
  useEffect(() => {
    fetchBookings();
  }, []);

  // ✅ Fetch Client's Scheduled Bookings
  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get("http://localhost:5000/api/booking/bookings", {
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

  // ✅ Cancel Booking
  const cancelBooking = async (bookingId) => {
    try {
      await axios.delete(`http://localhost:5000/api/booking/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove the canceled booking from state
      setBookings(bookings.filter((booking) => booking._id !== bookingId));
      alert("Session canceled successfully!");
    } catch (error) {
      console.error("Error canceling booking:", error);
      alert("Failed to cancel session.");
    }
  };

  return (
    <div className="vb-container">
      <h2 className="vb-title">Your Scheduled Sessions</h2>

      {/* ✅ Show loading state */}
      {loading && <p className="vb-loading">Loading bookings...</p>}

      {/* ✅ Show error message */}
      {error && <p className="vb-error">{error}</p>}

      {/* ✅ Show bookings */}
      {!loading && bookings.length === 0 ? (
        <p className="vb-no-bookings">You have no upcoming sessions.</p>
      ) : (
        <div className="vb-bookings-list">
          {bookings.map((booking) => (
            <div key={booking._id} className="vb-booking-card">
              <h3>{booking.trainerId.username}</h3>
              <p><strong>Specialties:</strong> {booking.trainerId.specialties.join(", ")}</p>
              <p><strong>Date:</strong> {new Date(booking.sessionTime).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {new Date(booking.sessionTime).toLocaleTimeString()}</p>
              <button className="vb-cancel-btn" onClick={() => cancelBooking(booking._id)}>
                Cancel Session
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewBookings;
