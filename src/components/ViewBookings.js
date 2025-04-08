import React, { useState, useEffect } from "react";
import axios from "axios";
import "./viewBookings.css";

const ViewBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("upcoming"); // Filter state: "upcoming", "past", "all"
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [notification, setNotification] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState({ 
    isOpen: false, 
    bookingId: null,
    trainerName: ""
  });
  const [feedbackData, setFeedbackData] = useState({ 
    rating: 5, 
    comment: "" 
  });
  const [feedbackErrors, setFeedbackErrors] = useState({});
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [canceling, setCanceling] = useState(null);
  
  const token = localStorage.getItem("token");

  // Fetch client bookings when component mounts or filter changes
  useEffect(() => {
    fetchBookings();
  }, [filter, page]);

  // ✅ Show notification
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ✅ Fetch Client's Scheduled Bookings with server-side filtering
  const fetchBookings = async () => {
    setLoading(true);
    setError("");
  
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/booking/bookings`, 
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            filter: filter !== "all" ? filter : undefined,
            page
          }
        }
      );
  
      // Debug what's being returned from the API
      console.log("API response:", response.data);
      
      // Make sure the bookings property exists and is an array
      if (response.data && Array.isArray(response.data.bookings)) {
        setBookings(response.data.bookings);
        setTotalPages(response.data.pagination?.pages || 1);
      } else if (Array.isArray(response.data)) {
        // If the response is the array directly
        setBookings(response.data);
        setTotalPages(1); // Default to 1 if no pagination info
      } else {
        // If the data structure is unexpected
        console.error("Unexpected API response format:", response.data);
        setBookings([]);
        setError("Received invalid data format from server.");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Failed to load bookings. Please try again.");
      setBookings([]); // Ensure bookings is always an array even on error
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

    setCanceling(bookingId);
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/booking/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove the canceled booking from state
      setBookings(bookings.filter((booking) => booking._id !== bookingId));
      showNotification("Session canceled successfully!");
    } catch (error) {
      console.error("Error canceling booking:", error);
      showNotification("Failed to cancel session.", "error");
    } finally {
      setCanceling(null);
    }
  };

  // ✅ Open feedback modal with trainer name for better context
  const openFeedbackModal = (bookingId) => {
    const booking = bookings.find(b => b._id === bookingId);
    if (!booking) return;
    
    setFeedbackModal({ 
      isOpen: true, 
      bookingId,
      trainerName: booking.trainerId.username 
    });
    setFeedbackData({ rating: 5, comment: "" });
    setFeedbackErrors({});
    
    // Add no-scroll class to body when modal is open
    document.body.classList.add('vb-no-scroll');
  };

  // ✅ Close feedback modal
  const closeFeedbackModal = () => {
    setFeedbackModal({ isOpen: false, bookingId: null, trainerName: "" });
    setFeedbackErrors({});
    
    // Remove no-scroll class when modal is closed
    document.body.classList.remove('vb-no-scroll');
  };

  // ✅ Handle feedback form changes with validation
  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedbackData({ ...feedbackData, [name]: value });
    
    // Clear error when user starts typing
    if (feedbackErrors[name]) {
      setFeedbackErrors({
        ...feedbackErrors,
        [name]: null
      });
    }
  };

  // Validate feedback before submission
  const validateFeedback = () => {
    const errors = {};
    
    // Rating validation (should be between 1-5)
    if (feedbackData.rating < 1 || feedbackData.rating > 5) {
      errors.rating = "Please select a rating from 1 to 5 stars";
    }
    
    // For low ratings (1-2), require comment
    if (feedbackData.rating <= 2 && (!feedbackData.comment || feedbackData.comment.trim() === "")) {
      errors.comment = "Please provide details about your experience";
    }
    
    setFeedbackErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit feedback with validation
  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackModal.bookingId) return;
    
    // Validate before submission
    if (!validateFeedback()) {
      return;
    }
    
    setSubmittingFeedback(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/booking/bookings/${feedbackModal.bookingId}/feedback`,
        feedbackData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the booking in state to show feedback is provided and store the feedback
      setBookings(bookings.map(booking => 
        booking._id === feedbackModal.bookingId 
          ? { 
              ...booking, 
              feedbackProvided: true,
              feedback: { ...feedbackData } // Store the feedback data for potential display later
            } 
          : booking
      ));
      
      showNotification("Thank you! Your feedback has been submitted.");
      closeFeedbackModal();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      
      // More specific error handling
      if (error.response?.status === 429) {
        showNotification("You've already provided feedback for this session.", "error");
        closeFeedbackModal();
      } else {
        showNotification(
          error.response?.data?.message || "Failed to submit feedback. Please try again.", 
          "error"
        );
      }
    } finally {
      setSubmittingFeedback(false);
    }
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

  return (
    <div className="vb-container">
      <div className="vb-header">
        <h2 className="vb-title">Your Scheduled Sessions</h2>
        <div className="vb-filter-buttons">
          <button 
            className={`vb-filter-btn ${filter === "upcoming" ? "active" : ""}`}
            onClick={() => {setFilter("upcoming"); setPage(1);}}
          >
            Upcoming
          </button>
          <button 
            className={`vb-filter-btn ${filter === "past" ? "active" : ""}`}
            onClick={() => {setFilter("past"); setPage(1);}}
          >
            Past
          </button>
          <button 
            className={`vb-filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => {setFilter("all"); setPage(1);}}
          >
            All
          </button>
        </div>
      </div>

      {/* ✅ Show notification */}
      {notification && (
        <div className={`vb-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* ✅ Show loading state */}
      {loading && <p className="vb-loading">Loading bookings...</p>}

      {/* ✅ Show error message */}
      {error && <p className="vb-error">{error}</p>}

      {/* ✅ Show bookings */}
      {!loading && (!bookings || bookings.length === 0) ? (
        <p className="vb-no-bookings">
          {filter === "upcoming" 
            ? "You have no upcoming sessions." 
            : filter === "past" 
              ? "You have no past sessions." 
              : "You have no bookings."}
        </p>
      ) : (
        <>
          <div className="vb-bookings-list">
            {bookings.map((booking) => {
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
                    <button 
                      className={`vb-cancel-btn ${canceling === booking._id ? 'canceling' : ''}`} 
                      onClick={() => cancelBooking(booking._id)}
                      disabled={canceling === booking._id}
                    >
                      {canceling === booking._id ? 'Canceling...' : 'Cancel Session'}
                    </button>
                  )}
                  {isPast && (
                    <div className="vb-past-session">
                      <span>{booking.completed ? "Session Completed" : "Session Time Passed"}</span>
                      
                      {/* Display feedback section conditionally */}
                      {!booking.feedbackProvided ? (
                        <button 
                          className="vb-feedback-btn"
                          onClick={() => openFeedbackModal(booking._id)}
                        >
                          Rate this Session
                        </button>
                      ) : (
                        <div className="vb-feedback-provided-container">
                          <span className="vb-feedback-provided">Feedback Provided</span>
                          {booking.feedback && (
                            <div className="vb-feedback-summary">
                              <div className="vb-star-display">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span key={star} className={`vb-star-small ${booking.feedback.rating >= star ? 'active' : ''}`}>
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* ✅ Pagination controls */}
          {totalPages > 1 && (
            <div className="vb-pagination">
              <button 
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="vb-pagination-btn"
              >
                Previous
              </button>
              <span className="vb-pagination-info">Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="vb-pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* ✅ Enhanced Feedback Modal */}
      {feedbackModal.isOpen && (
        <div className="vb-modal-overlay" onClick={closeFeedbackModal}>
          <div className="vb-modal" onClick={e => e.stopPropagation()}>
            <button className="vb-modal-close" onClick={closeFeedbackModal}>×</button>
            <h3>Rate Your Session with {feedbackModal.trainerName}</h3>
            <p className="vb-modal-subtitle">Your feedback helps trainers improve their services</p>
            
            <form onSubmit={submitFeedback}>
              <div className="vb-form-group">
                <label>How was your experience?</label>
                <div className="vb-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`vb-star ${feedbackData.rating >= star ? 'active' : ''}`}
                      onClick={() => setFeedbackData({...feedbackData, rating: star})}
                      aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                    >
                      <span className="vb-star-icon">★</span>
                      <span className="vb-star-label">
                        {star === 1 && 'Poor'}
                        {star === 2 && 'Fair'}
                        {star === 3 && 'Good'}
                        {star === 4 && 'Great'}
                        {star === 5 && 'Excellent'}
                      </span>
                    </button>
                  ))}
                </div>
                {feedbackErrors.rating && (
                  <div className="vb-form-error">{feedbackErrors.rating}</div>
                )}
              </div>
              
              <div className="vb-form-group">
                <label>
                  Share your experience {feedbackData.rating <= 2 ? '(required)' : '(optional)'}:
                </label>
                <textarea
                  name="comment"
                  value={feedbackData.comment}
                  onChange={handleFeedbackChange}
                  rows="4"
                  placeholder={
                    feedbackData.rating <= 2 
                      ? "Please tell us what went wrong and how we can improve" 
                      : "Share any additional thoughts about your session"
                  }
                  className={feedbackErrors.comment ? "vb-input-error" : ""}
                ></textarea>
                {feedbackErrors.comment && (
                  <div className="vb-form-error">{feedbackErrors.comment}</div>
                )}
              </div>
              
              <div className="vb-modal-actions">
                <button 
                  type="button" 
                  className="vb-modal-cancel" 
                  onClick={closeFeedbackModal}
                  disabled={submittingFeedback}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="vb-modal-submit"
                  disabled={submittingFeedback}
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewBookings;