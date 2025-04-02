import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Availability.css";
import { useNavigate } from "react-router-dom";

const TrainerAvailability = () => {
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [updatedTime, setUpdatedTime] = useState("");
  const [editPosition, setEditPosition] = useState({ top: 10, left: -20 });
  const editFormRef = useRef(null);
  const navigate = useNavigate();

  // Format time for display
  const formatTimeDisplay = (timeString) => {
    try {
      return new Date(timeString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return timeString;
    }
  };

  // Format date for display
  const formatDateDisplay = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  // Filter out past availability slots
  const filterPastAvailability = (slots) => {
    const now = new Date();

    return slots.map(slot => {
      // Filter out past time slots for each day
      const updatedTimes = slot.time.filter(timeStr => {
        const timeDate = new Date(timeStr);
        return timeDate > now;
      });

      return {
        ...slot,
        time: updatedTimes
      };
    }).filter(slot => slot.time.length > 0); // Remove days with no remaining slots
  };

  // Fetch the trainer's availability from the backend - moved to a useCallback
  const fetchAvailability = useCallback(async (id, token) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Making request to fetch availability for Trainer ID:", id);

      const response = await axios.get(
        `http://localhost:5000/api/trainers/availability/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.data) {
        console.warn("No availability data found.");
        setAvailability([]);
      } else {
        // Filter out past availability slots
        const filteredData = filterPastAvailability(response.data);
        setAvailability(filteredData);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("No availability data found for this trainer yet.");
        setAvailability([]);
      } else {
        console.error("Error fetching availability:", error.response?.data || error.message);
        setError("Failed to fetch availability. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth and load data on component mount
  useEffect(() => {
    const storedTrainerId = localStorage.getItem("trainerId");
    const token = localStorage.getItem("token");

    if (!storedTrainerId || !token) {
      console.error("Trainer ID or token is missing in localStorage!");
      setError("Authentication information is missing. Please log in again.");
      setLoading(false);
      setTimeout(() => {
        navigate("/login"); // Redirect to login after showing the error
      }, 3000);
      return;
    }

    fetchAvailability(storedTrainerId, token);
  }, [fetchAvailability, navigate]);

  // Close the edit form when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (editFormRef.current && !editFormRef.current.contains(event.target)) {
        setEditingSlot(null);
      }
    }

    // Add event listener only when editing
    if (editingSlot) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingSlot]);

  // Add a new time slot or update existing slots
  const updateAvailability = async () => {
    if (!selectedTime) {
      setError("Please select a time before setting availability.");
      return;
    }

    const trainerId = localStorage.getItem("trainerId");
    const token = localStorage.getItem("token");

    if (!trainerId || !token) {
      setError("Authentication information is missing. Please log in again.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    try {
      setLoading(true);
      const formattedDate = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });

      // Check if the selected day already exists in availability
      const existingSlot = availability.find((slot) => slot.day === dayName);

      let updatedSlots = [];
      if (existingSlot) {
        // Add new time slot to the existing day
        updatedSlots = availability.map((slot) =>
          slot.day === dayName
            ? { ...slot, time: [...slot.time, `${formattedDate}T${selectedTime}:00Z`] }
            : slot
        );
      } else {
        // Add a completely new day with a new time slot
        updatedSlots = [...availability, { day: dayName, time: [`${formattedDate}T${selectedTime}:00Z`] }];
      }

      const response = await axios.put(
        "http://localhost:5000/api/trainers/availability",
        {
          trainerId,
          availableSlots: updatedSlots,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Filter out past times from the response
      const filteredSlots = filterPastAvailability(response.data.availability.availableSlots || []);
      setAvailability(filteredSlots);
      setError(null);
      setSelectedTime(""); // Clear the time input after successful update
    } catch (error) {
      console.error("Error updating availability:", error.response?.data || error.message);
      setError("Failed to update availability. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete a specific time slot
  const removeTimeSlot = async (day, timeToRemove) => {
    // Confirmation dialog
    const isConfirmed = window.confirm("Are you sure you want to delete this time slot?");
    if (!isConfirmed) return;

    const trainerId = localStorage.getItem("trainerId");
    const token = localStorage.getItem("token");

    if (!trainerId || !token) {
      setError("Authentication information is missing. Please log in again.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    try {
      setLoading(true);
      // Find the existing slot for the selected day
      const existingSlot = availability.find((slot) => slot.day === day);
      if (!existingSlot) return;

      // Filter out the specific time being removed
      const updatedTimeSlots = existingSlot.time.filter((time) => time !== timeToRemove);

      let updatedSlots;
      if (updatedTimeSlots.length === 0) {
        // If no time slots left, remove the entire day
        updatedSlots = availability.filter((slot) => slot.day !== day);
      } else {
        // Otherwise, update the day's available slots
        updatedSlots = availability.map((slot) =>
          slot.day === day ? { ...slot, time: updatedTimeSlots } : slot
        );
      }

      const response = await axios.put(
        "http://localhost:5000/api/trainers/availability",
        {
          trainerId,
          availableSlots: updatedSlots,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Filter out past times from the response
      const filteredSlots = filterPastAvailability(response.data.availability.availableSlots || []);
      setAvailability(filteredSlots);
      setError(null);
    } catch (error) {
      console.error("Error deleting time slot:", error.response?.data || error.message);
      setError("Failed to remove time slot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle click on an existing time slot for editing
  const handleEditSlot = (day, time, event) => {
    // Stop event propagation to prevent any parent elements from capturing the click
    if (event) event.stopPropagation();

    console.log("Edit slot triggered:", day, time);

    // Calculate position for the popup
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    // Position the popup above the button
    setEditPosition({
      top: buttonRect.top + scrollTop - 120, // Position above the button
      left: buttonRect.left - 150 // Center the popup relative to the button
    });

    setEditingSlot({ day, time });

    // Adjust for timezone issues by explicitly creating a date with the UTC time
    const timeObj = new Date(time);
    const hours = String(timeObj.getHours()).padStart(2, '0');
    const minutes = String(timeObj.getMinutes()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;
    setUpdatedTime(formattedTime);
  };

  // Save the updated time slot
  const saveUpdatedSlot = async () => {
    if (!updatedTime) {
      setError("Please select a time before updating.");
      return;
    }

    const trainerId = localStorage.getItem("trainerId");
    const token = localStorage.getItem("token");

    if (!trainerId || !token) {
      setError("Authentication information is missing. Please log in again.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    try {
      setLoading(true);
      // Extract date from the original time slot to maintain the same date
      const originalDate = new Date(editingSlot.time).toISOString().split('T')[0];

      // Format the updated time correctly
      const [hours, minutes] = updatedTime.split(':');
      const formattedTime = `${originalDate}T${hours}:${minutes}:00Z`;

      // Update the time slot in the availability array
      const updatedSlots = availability.map((slot) =>
        slot.day === editingSlot.day
          ? {
            ...slot,
            time: slot.time.map((t) =>
              t === editingSlot.time ? formattedTime : t
            ),
          }
          : slot
      );

      const response = await axios.put(
        "http://localhost:5000/api/trainers/availability",
        {
          trainerId,
          availableSlots: updatedSlots,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Filter out past times from the response
      const filteredSlots = filterPastAvailability(response.data.availability.availableSlots || []);
      setAvailability(filteredSlots);
      setEditingSlot(null); // Clear editing state
      setError(null);
    } catch (error) {
      console.error("Error updating time slot:", error.response?.data || error.message);
      setError("Failed to update time slot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="availability-container">
      <h2>Manage Availability</h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading availability...</div>
      ) : (
        <>
          {/* Calendar for Date Selection */}
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileClassName={({ date }) =>
              availability.some((slot) =>
                slot.time.some((t) => new Date(t).toDateString() === date.toDateString())
              )
                ? "available-day"
                : ""
            }
            minDate={new Date()} // Prevent selecting dates in the past
          />

          {/* Time Selection Input */}
          <div className="time-selection">
            <label>Select Time:</label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              required
            />
          </div>

          {/* Button to Add/Update Availability */}
          <button
            onClick={updateAvailability}
            className="update-btn"
            disabled={loading || !selectedTime}
          >
            {loading ? "Setting..." : "Set Available"}
          </button>

          {/* List of Current Availability Slots */}
          {availability.length > 0 ? (
            <div className="availability-list">
              <h3>Current Availability</h3>
              <ul>
                {availability.map((slot, index) => (
                  <li key={index}>
                    <ul>
                      {slot.time.map((t, i) => {
                        // Get full date from time string
                        const timeDate = new Date(t);
                        return (
                          <li key={i} className="slot-item">
                            <strong>{formatDateDisplay(t)}:</strong> {formatTimeDisplay(t)}
                            <div className="slot-actions">
                              <button
                                className="delete-btn"
                                onClick={() => removeTimeSlot(slot.day, t)}
                                disabled={loading}
                              >
                                ❌
                              </button>
                              <button
                                className="edit-btn"
                                onClick={(e) => handleEditSlot(slot.day, t, e)}
                                disabled={loading}
                              >
                                ✏️
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No availability slots found. Add your first time slot above.</p>
          )}

          {/* Popup Edit Form */}
          {editingSlot && (
            <div 
              ref={editFormRef}
              className="popup-edit-form"
              style={{ 
                position: 'absolute',
                top: `${editPosition.top}px`,
                left: `${editPosition.left}px`,
                zIndex: 1000
              }}
            >
              <h3>Edit Time Slot</h3>
              <p>Editing: {formatTimeDisplay(editingSlot.time)}</p>
              <label>New Time:</label>
              <input
                type="time"
                value={updatedTime}
                onChange={(e) => setUpdatedTime(e.target.value)}
                autoFocus
              />
              <div className="edit-buttons">
                <button
                  onClick={saveUpdatedSlot}
                  disabled={loading || !updatedTime}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button onClick={() => setEditingSlot(null)}>Cancel</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrainerAvailability;