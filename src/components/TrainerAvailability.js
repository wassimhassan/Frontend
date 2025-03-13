import React, { useState, useEffect } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Availability.css";

const TrainerAvailability = ({ trainerId }) => {
  const [availability, setAvailability] = useState([]); // Stores the trainer's availability slots
  const [selectedDate, setSelectedDate] = useState(new Date()); // Selected date from the calendar
  const [selectedTime, setSelectedTime] = useState(""); // Selected time from the input
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [editingSlot, setEditingSlot] = useState(null); // Track the time slot being edited
  const [updatedTime, setUpdatedTime] = useState(""); // Track the updated time for the slot

  useEffect(() => {
    const storedTrainerId = localStorage.getItem("trainerId");

    if (!storedTrainerId) {
      console.error("Trainer ID is missing in localStorage!");
      alert("Trainer ID is missing. Please log in again.");
      return;
    }

    console.log("Fetching availability for Trainer ID:", storedTrainerId);

    fetchAvailability(storedTrainerId);
  }, []);

  // Fetch the trainer's availability from the backend
  const fetchAvailability = async (id) => {
    setLoading(true);
    try {
      console.log("Making request to fetch availability for Trainer ID:", id);

      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/trainers/availability/${id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (!response.data || response.data.length === 0) {
        console.warn("No availability data found.");
        setAvailability([]);
      } else {
        setAvailability(response.data);
      }
    } catch (error) {
      console.error("Error fetching availability:", error.response?.data || error.message);
      alert("Failed to fetch availability. Check if trainer exists.");
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a new time slot or update existing slots
  const updateAvailability = async () => {
    if (!selectedTime) {
      alert("Please select a time before setting availability.");
      return;
    }

    const trainerId = localStorage.getItem("trainerId"); // Get Trainer ID from storage

    if (!trainerId) {
      alert("Trainer ID is missing. Please log in again.");
      return;
    }

    try {
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
        `${process.env.REACT_APP_BACKEND_URL}/api/trainers/availability`,
        {
          trainerId,
          availableSlots: updatedSlots,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setAvailability(response.data.availableSlots || []);
      alert("Availability successfully updated!");
    } catch (error) {
      console.error("Error updating availability:", error.response?.data || error.message);
      alert("Failed to update availability. Please try again.");
    }
  };

  // Delete a specific time slot
  const removeTimeSlot = async (day, timeToRemove) => {
    // Confirmation dialog
    const isConfirmed = window.confirm("Are you sure you want to delete this time slot?");
    if (!isConfirmed) return; // Stop if the user cancels
  
    const trainerId = localStorage.getItem("trainerId"); // Get Trainer ID from storage
  
    if (!trainerId) {
      alert("Trainer ID is missing. Please log in again.");
      return;
    }
  
    try {
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
  
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/trainers/availability`,
        {
          trainerId,
          availableSlots: updatedSlots,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
  
      setAvailability(updatedSlots);
      alert("Time slot removed successfully!");
    } catch (error) {
      console.error("Error deleting time slot:", error.response?.data || error.message);
      alert("Failed to remove time slot. Please try again.");
    }
  };

  // Handle click on an existing time slot for editing
  const handleEditSlot = (day, time) => {
    setEditingSlot({ day, time });
    setUpdatedTime(new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  };

  // Save the updated time slot
  const saveUpdatedSlot = async () => {
    if (!updatedTime) {
      alert("Please select a time before updating.");
      return;
    }

    const trainerId = localStorage.getItem("trainerId"); // Get Trainer ID from storage

    if (!trainerId) {
      alert("Trainer ID is missing. Please log in again.");
      return;
    }

    try {
      const formattedTime = `${selectedDate.toISOString().split("T")[0]}T${updatedTime}:00Z`;

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

      // Send updated availability to the backend
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/trainers/availability`,
        {
          trainerId,
          availableSlots: updatedSlots,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Update local state with the response from the backend
      setAvailability(response.data.availableSlots || []);
      setEditingSlot(null); // Clear editing state
      alert("Time slot updated successfully!");
    } catch (error) {
      console.error("Error updating time slot:", error.response?.data || error.message);
      alert("Failed to update time slot. Please try again.");
    }
  };

  return (
    <div className="availability-container">
      <h2>Manage Availability</h2>

      {loading ? (
        <p>Loading availability...</p>
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
          <button onClick={updateAvailability} className="update-btn">
            Set Available
          </button>

          {/* List of Current Availability Slots */}
          {availability.length > 0 ? (
            <div className="availability-list">
              <h3>Current Availability</h3>
              <ul>
                {availability.map((slot, index) => (
                  <li key={index}>
                    <strong>{slot.day}:</strong>
                    <ul>
                      {slot.time.map((t, i) => (
                        <li key={i}>
                          {new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          <button className="delete-btn" onClick={() => removeTimeSlot(slot.day, t)}>
                            ❌
                          </button>
                          <button className="edit-btn" onClick={() => handleEditSlot(slot.day, t)}>
                            ✏️
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No availability slots found.</p>
          )}

          {/* Edit Form for Updating Time Slot */}
          {editingSlot && (
            <div className="edit-form">
              <h3>Edit Time Slot</h3>
              <label>New Time:</label>
              <input
                type="time"
                value={updatedTime}
                onChange={(e) => setUpdatedTime(e.target.value)}
              />
              <button onClick={saveUpdatedSlot}>Save</button>
              <button onClick={() => setEditingSlot(null)}>Cancel</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrainerAvailability;