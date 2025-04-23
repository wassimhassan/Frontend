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
  const [selectedPrice, setSelectedPrice] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [updatedTime, setUpdatedTime] = useState("");
  const [updatedPrice, setUpdatedPrice] = useState("");
  const [editPosition, setEditPosition] = useState({ top: 10, left: -20 });
  const editFormRef = useRef(null);
  const navigate = useNavigate();

  // Format time for display - using local time
  const formatTimeDisplay = (timeString) => {
    try {
      if (!timeString) return ""; // Handle null or undefined

      // Handle object with datetime property
      if (typeof timeString === 'object' && timeString.datetime) {
        const date = new Date(timeString.datetime);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          });
        }
      }
      
      // If it's a string, try to parse it directly
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });
      }
      
      // If we can't parse it, return the original string
      return String(timeString);
    } catch (e) {
      console.error("Error formatting time:", e, timeString);
      return String(timeString);
    }
  };

  // Format date for display - using local time
  const formatDateDisplay = (dateString) => {
    try {
      if (!dateString) return ""; // Handle null or undefined

      // Handle object with datetime property
      if (typeof dateString === 'object' && dateString.datetime) {
        const date = new Date(dateString.datetime);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString([], {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      }
      
      // If it's a string, try to parse it directly
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString([], {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      
      // If we can't parse it, return the original string
      return String(dateString);
    } catch (e) {
      console.error("Error formatting date:", e, dateString);
      return String(dateString);
    }
  };

  // Filter out past availability slots
  const filterPastAvailability = (slots) => {
    if (!Array.isArray(slots)) {
      console.error("Expected slots to be an array, got:", slots);
      return [];
    }

    const now = new Date();

    return slots.map(slot => {
      if (!slot || !slot.time || !Array.isArray(slot.time)) {
        console.error("Invalid slot format:", slot);
        return { ...slot, time: [] };
      }

      // Check if slot.time is an array of objects or strings
      const isObjectTime = slot.time.length > 0 && typeof slot.time[0] === 'object';

      // Filter out past time slots for each day
      const updatedTimes = slot.time.filter(timeItem => {
        if (!timeItem) return false;

        try {
          const timeDate = isObjectTime ? new Date(timeItem.datetime) : new Date(timeItem);
          return !isNaN(timeDate.getTime()) && timeDate > now;
        } catch (e) {
          console.error("Error parsing date:", e, timeItem);
          return false;
        }
      });

      return {
        ...slot,
        time: updatedTimes
      };
    }).filter(slot => slot.time && slot.time.length > 0); // Remove days with no remaining slots
  };

  // Convert old format (strings) to new format (objects with datetime and price)
  const convertOldFormatToNew = (slots, defaultPrice) => {
    if (!Array.isArray(slots)) {
      console.error("Expected slots to be an array, got:", slots);
      return [];
    }

    return slots.map(slot => {
      if (!slot || !slot.time || !Array.isArray(slot.time)) {
        console.error("Invalid slot format:", slot);
        return { ...slot, time: [] };
      }

      // Check if slot.time is already in new format
      if (slot.time.length > 0 && typeof slot.time[0] === 'object' && slot.time[0].datetime) {
        return slot;
      }

      // Convert old format to new format
      return {
        ...slot,
        time: slot.time.map(timeStr => {
          if (!timeStr) {
            console.error("Invalid time string:", timeStr);
            return { datetime: new Date().toISOString(), price: defaultPrice || "0" };
          }

          return {
            datetime: timeStr,
            price: defaultPrice || "0"
          };
        })
      };
    });
  };

  // Create a date string that preserves local time
  const createLocalISOString = (date) => {
    try {
      if (!date || isNaN(date.getTime())) {
        console.error("Invalid date for ISO string:", date);
        return new Date().toISOString();
      }
      
      // Get date components
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      // Get timezone offset
      const tzOffset = date.getTimezoneOffset() * -1; // Invert as getTimezoneOffset returns negative for east
      const tzOffsetHours = Math.floor(Math.abs(tzOffset) / 60);
      const tzOffsetMinutes = Math.abs(tzOffset) % 60;
      const tzSign = tzOffset >= 0 ? '+' : '-';
      const tzString = `${tzSign}${String(tzOffsetHours).padStart(2, '0')}:${String(tzOffsetMinutes).padStart(2, '0')}`;

      // Create ISO string with explicit timezone
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${tzString}`;
    } catch (e) {
      console.error("Error creating ISO string:", e);
      return new Date().toISOString();
    }
  };

  // Create a correct date/time object
  const createCorrectDateTime = (date, timeString) => {
    try {
      if (!timeString || !timeString.includes(':')) {
        console.error("Invalid time string format:", timeString);
        return new Date();
      }

      // Clone the date to avoid modifying the original
      const newDate = new Date(date);
      if (isNaN(newDate.getTime())) {
        console.error("Invalid date:", date);
        return new Date();
      }

      const [hours, minutes] = timeString.split(':');
      
      // Set the hours and minutes
      newDate.setHours(parseInt(hours, 10) || 0);
      newDate.setMinutes(parseInt(minutes, 10) || 0);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);

      return newDate;
    } catch (e) {
      console.error("Error creating date time:", e);
      return new Date();
    }
  };

  // Convert availability slots to backend format
  const convertToBackendFormat = (availabilitySlots) => {
    if (!Array.isArray(availabilitySlots)) {
      console.error("Expected availabilitySlots to be an array, got:", availabilitySlots);
      return [];
    }

    return availabilitySlots.flatMap(slot => {
      if (!slot || !slot.day || !slot.time || !Array.isArray(slot.time)) {
        console.error("Invalid slot format:", slot);
        return [];
      }

      return slot.time.map(timeItem => {
        try {
          // Extract the time information
          const timeStr = typeof timeItem === 'object' ? timeItem.datetime : timeItem;
          const price = typeof timeItem === 'object' ? timeItem.price : defaultPrice;

          if (!timeStr) {
            console.error("Invalid time string:", timeStr);
            return null;
          }

          // Parse the time from the string
          const timeObj = new Date(timeStr);
          if (isNaN(timeObj.getTime())) {
            console.error("Invalid date object:", timeStr);
            return null;
          }

          // Extract hours and minutes in 24-hour format
          const hours = String(timeObj.getHours()).padStart(2, '0');
          const minutes = String(timeObj.getMinutes()).padStart(2, '0');

          // Create the startTime in HH:MM format
          const startTime = `${hours}:${minutes}`;

          // Add one hour for end time (handling overflow to next day)
          let endHour = (timeObj.getHours() + 1) % 24;
          const endTime = `${String(endHour).padStart(2, '0')}:${minutes}`;

          return {
            day: slot.day,
            startTime: startTime,
            endTime: endTime,
            price: parseFloat(price) || 0,
            // Include date information for better identification
            fullDate: slot.fullDate || timeObj.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          };
        } catch (e) {
          console.error("Error converting time slot to backend format:", e);
          return null;
        }
      }).filter(Boolean); // Remove any null entries
    });
  };

  // Fetch the trainer's availability from the backend
  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const trainerId = localStorage.getItem("trainerId");
      const token = localStorage.getItem("token");

      if (!trainerId || !token) {
        setError("Authentication information is missing.");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      console.log("Making request to fetch availability for Trainer ID:", trainerId);

      // Fetch trainer profile to get default session price first
      const profileResponse = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/trainers/trainer/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let price = "0";
      if (profileResponse.data && profileResponse.data.sessionPrice) {
        price = profileResponse.data.sessionPrice.toString();
        setDefaultPrice(price);
        setSelectedPrice(price);
      }

      // Then fetch availability
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/trainers/availability/${trainerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Received availability data:", response.data);

      if (!response.data) {
        console.warn("No availability data found.");
        setAvailability([]);
      } else {
        // Process the data based on its structure
        let processedData = [];

        // Handle different possible response formats
        if (Array.isArray(response.data)) {
          // API returned array of slots
          processedData = processApiSlots(response.data, price);
        } else if (response.data.availability && Array.isArray(response.data.availability)) {
          // API returned { availability: [...] }
          processedData = processApiSlots(response.data.availability, price);
        } else if (response.data.availableSlots && Array.isArray(response.data.availableSlots)) {
          // API returned { availableSlots: [...] }
          processedData = processApiSlots(response.data.availableSlots, price);
        } else {
          // Try to handle as is
          console.log("Handling raw data format");
          const filteredData = filterPastAvailability(response.data);
          processedData = convertOldFormatToNew(filteredData, price);
        }

        console.log("Processed availability data:", processedData);
        
        // Set the processed data
        setAvailability(processedData);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      setError("Failed to fetch availability. Please check your connection and try again.");
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Process API slots into the frontend format
  const processApiSlots = (apiSlots, defaultPrice) => {
    // Safely handle the data - group by day and date
    const slotMap = {};

    if (!Array.isArray(apiSlots)) {
      console.error("Expected apiSlots to be an array, got:", apiSlots);
      return [];
    }

    console.log("Processing API slots:", apiSlots);

    apiSlots.forEach(slot => {
      if (!slot || !slot.day) {
        console.error("Invalid slot format:", slot);
        return;
      }

      // Use both day and fullDate as a combined key
      const slotKey = slot.fullDate ? `${slot.day}-${slot.fullDate}` : slot.day;

      if (!slotMap[slotKey]) {
        slotMap[slotKey] = {
          day: slot.day,
          fullDate: slot.fullDate || null,
          time: []
        };
      }

      // Handle time based on format
      if (slot.time && Array.isArray(slot.time)) {
        // Old format with array of times
        slot.time.forEach(timeStr => {
          if (!timeStr) return;

          slotMap[slotKey].time.push({
            datetime: timeStr,
            price: slot.price?.toString() || defaultPrice || "0"
          });
        });
      } else if (slot.startTime) {
        // New format with startTime/endTime
        try {
          let dateTime;

          // If we have a fullDate, use it to create a more accurate date
          if (slot.fullDate) {
            // Parse the full date 
            const dateParts = slot.fullDate.split(', '); // Assumes format: "Month Day, Year"

            if (dateParts.length >= 2) {
              const dateStr = dateParts.join(', '); // Rejoin if it was split
              const date = new Date(dateStr);

              if (!isNaN(date.getTime())) {
                // We have a valid date, now set the time
                const [hours, minutes] = slot.startTime.split(':');
                date.setHours(parseInt(hours, 10) || 0);
                date.setMinutes(parseInt(minutes, 10) || 0);
                date.setSeconds(0);
                date.setMilliseconds(0);
                dateTime = date;
              }
            }
          }

          // Fallback to day-based approach if fullDate parsing failed
          if (!dateTime) {
            dateTime = createDateFromDayAndTime(slot.day, slot.startTime);
          }

          slotMap[slotKey].time.push({
            datetime: dateTime.toISOString(),
            price: slot.price?.toString() || defaultPrice || "0",
            fullDate: slot.fullDate
          });
        } catch (e) {
          console.error("Error processing time slot:", e);
        }
      }
    });

    console.log("Processed slot map:", slotMap);

    // Convert to array and filter out past slots
    return filterPastAvailability(Object.values(slotMap));
  };

  // Create a date based on day name and time
  const createDateFromDayAndTime = (dayName, timeString) => {
    if (!timeString || typeof timeString !== 'string') {
      console.error("Invalid time string:", timeString);
      return new Date();
    }

    try {
      const today = new Date();
      const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        .indexOf(dayName);

      if (dayIndex === -1) return today;

      const currentDayIndex = today.getDay();
      const daysToAdd = (dayIndex + 7 - currentDayIndex) % 7;

      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysToAdd);

      // Safely split the time string
      const timeParts = timeString.split(':');
      if (timeParts.length < 2) {
        console.error("Invalid time format:", timeString);
        return targetDate;
      }

      const hours = parseInt(timeParts[0]) || 0;
      const minutes = parseInt(timeParts[1]) || 0;
      targetDate.setHours(hours, minutes, 0, 0);

      return targetDate;
    } catch (e) {
      console.error("Error creating date from day and time:", e);
      return new Date();
    }
  };

  // Check auth and load data on component mount
  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

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

  // Update availability function
  const updateAvailability = async () => {
    if (!selectedTime) {
      setError("Please select a time before setting availability.");
      return;
    }

    if (!selectedPrice) {
      setError("Please set a session price.");
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

      // Create a date object with the correct date and time
      const timeDate = createCorrectDateTime(selectedDate, selectedTime);
      console.log("Created time date:", timeDate);

      // Get the day name directly from the selected date
      const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

      // Also get the full date string for better identification
      const fullDateStr = selectedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      console.log(`Setting availability for ${dayName}, ${fullDateStr} at ${selectedTime}`);

      // Create new time slot with price - using the exact ISO string to prevent timezone conversion
      const newTimeSlot = {
        datetime: createLocalISOString(timeDate),
        price: selectedPrice,
        fullDate: fullDateStr // Store the full date information
      };
      console.log("Created time slot:", newTimeSlot);

      // Check if the selected day already exists in availability
      const existingSlot = availability.find((slot) => 
        // Check both day and date to be more specific
        slot.day === dayName && slot.fullDate === fullDateStr
      );

      let updatedSlots = [];
      if (existingSlot) {
        // Add new time slot to the existing day
        updatedSlots = availability.map((slot) =>
          (slot.day === dayName && slot.fullDate === fullDateStr)
            ? { ...slot, time: [...slot.time, newTimeSlot] }
            : slot
        );
      } else {
        // Add a completely new day with a new time slot
        updatedSlots = [...availability, {
          day: dayName,
          fullDate: fullDateStr, // Store the full date
          time: [newTimeSlot]
        }];
      }

      // Format data to match backend expectations
      const formattedAvailability = convertToBackendFormat(updatedSlots);
      console.log("Formatted availability for backend:", formattedAvailability);

      // Save default price if changed
      if (defaultPrice !== selectedPrice) {
        await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/trainers/trainer/profile`,
          {
            sessionPrice: parseFloat(selectedPrice)
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setDefaultPrice(selectedPrice);
      }

      // Update availability
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/trainers/availability`,
        {
          availability: formattedAvailability
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Response from updating availability:", response.data);

      if (response.data) {
        // Refresh to get the latest data
        await fetchAvailability();
        setSelectedTime(""); // Clear the time input after successful update
      }

      setError(null);
    } catch (error) {
      console.error("Error updating availability:", error);
      setError("Failed to update availability. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handling of updating a time slot
  const saveUpdatedSlot = async () => {
    if (!updatedTime) {
      setError("Please select a time before updating.");
      return;
    }

    if (!updatedPrice) {
      setError("Please set a price for this session.");
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

      if (!editingSlot || !editingSlot.time) {
        throw new Error("No slot selected for editing");
      }

      // Get the original datetime string
      const originalDatetime = typeof editingSlot.time === 'object' ?
        editingSlot.time.datetime : editingSlot.time;

      if (!originalDatetime) {
        throw new Error("Invalid datetime in editing slot");
      }

      // Create a date object from the original datetime
      const originalDate = new Date(originalDatetime);
      console.log("Original date for editing:", originalDate);

      if (isNaN(originalDate.getTime())) {
        throw new Error("Invalid date: " + originalDatetime);
      }

      // Get the time parts
      if (!updatedTime.includes(':')) {
        throw new Error("Invalid time format: " + updatedTime);
      }

      const [hours, minutes] = updatedTime.split(':');

      // Create a new date object with the same day but updated time
      const updatedDate = new Date(originalDate);
      updatedDate.setHours(parseInt(hours, 10) || 0);
      updatedDate.setMinutes(parseInt(minutes, 10) || 0);
      updatedDate.setSeconds(0);
      updatedDate.setMilliseconds(0);

      console.log("Updated date for slot:", updatedDate);

      // Format the date to ISO string with explicit timezone
      const formattedDateTime = createLocalISOString(updatedDate);
      console.log("Formatted date/time:", formattedDateTime);

      // Update the time slot in the availability array
      const updatedSlots = availability.map((slot) => {
        if (slot.day === editingSlot.day) {
          return {
            ...slot,
            time: slot.time.map((t) => {
              const timeToCompare = typeof t === 'object' ? t.datetime : t;
              if (timeToCompare === originalDatetime) {
                return {
                  datetime: formattedDateTime,
                  price: updatedPrice
                };
              }
              return t;
            }),
          };
        }
        return slot;
      });

      // Format data to match backend expectations
      const formattedAvailability = convertToBackendFormat(updatedSlots);
      console.log("Formatted availability for update:", formattedAvailability);

      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/trainers/availability`,
        {
          availability: formattedAvailability
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Response from updating slot:", response.data);

      if (response.data) {
        // Refresh to get the latest data
        await fetchAvailability();
      }

      setEditingSlot(null); // Clear editing state
      setError(null);
    } catch (error) {
      console.error("Error updating time slot:", error);
      setError("Failed to update time slot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Remove time slot
  const removeTimeSlot = async (day, timeSlot) => {
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
      const timeToRemove = typeof timeSlot === 'object' ? timeSlot.datetime : timeSlot;
      const updatedTimeSlots = existingSlot.time.filter((t) => {
        const timeToCompare = typeof t === 'object' ? t.datetime : t;
        return timeToCompare !== timeToRemove;
      });

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

      // Format data to match backend expectations
      const formattedAvailability = convertToBackendFormat(updatedSlots);

      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/trainers/availability`,
        {
          availability: formattedAvailability
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        // Refresh to get the latest data
        await fetchAvailability();
      }

      setError(null);
    } catch (error) {
      console.error("Error deleting time slot:", error);
      setError("Failed to remove time slot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the edit popup
  const handleEditSlot = (day, timeSlot, event) => {
    // Stop event propagation to prevent any parent elements from capturing the click
    if (event) event.stopPropagation();

    // Calculate position for the popup
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    // Position the popup near the button
    setEditPosition({
      top: buttonRect.top + scrollTop - 120, // Position above the button
      left: buttonRect.left - 150 // Center the popup relative to the button
    });

    setEditingSlot({ day, time: timeSlot });

    try {
      // Adjust for timezone issues by explicitly creating a date with the local time
      const timeStr = typeof timeSlot === 'object' ? timeSlot.datetime : timeSlot;

      if (!timeStr) {
        throw new Error("Invalid time string");
      }

      const timeObj = new Date(timeStr);

      if (isNaN(timeObj.getTime())) {
        throw new Error("Invalid date");
      }

      const hours = String(timeObj.getHours()).padStart(2, '0');
      const minutes = String(timeObj.getMinutes()).padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;

      setUpdatedTime(formattedTime);
      setUpdatedPrice(typeof timeSlot === 'object' ? timeSlot.price : defaultPrice);
    } catch (e) {
      console.error("Error setting edit values:", e);
      setUpdatedTime("00:00");
      setUpdatedPrice(defaultPrice);
    }
  };

  // Helper to get datetime from a time slot (handles both formats)
  const getDatetime = (timeSlot) => {
    if (!timeSlot) return "";
    return typeof timeSlot === 'object' ? timeSlot.datetime : timeSlot;
  };

  // Helper to get price from a time slot (handles both formats)
  const getPrice = (timeSlot) => {
    if (!timeSlot) return defaultPrice;
    return typeof timeSlot === 'object' ? timeSlot.price : defaultPrice;
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
                slot.time.some((t) => {
                  try {
                    const datetime = getDatetime(t);
                    return new Date(datetime).toDateString() === date.toDateString();
                  } catch (e) {
                    return false;
                  }
                })
              )
                ? "available-day"
                : ""
            }
            minDate={new Date()} // Prevent selecting dates in the past
          />

          {/* Price and Time Selection Inputs */}
          <div className="price-time-selection">
            <div className="time-selection">
              <label>Select Time:</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
              />
            </div>

            <div className="price-selection">
              <label>Session Price ($):</label>
              <input
                type="number"
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                placeholder="Price per session"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Button to Add/Update Availability */}
          <button
            onClick={updateAvailability}
            className="update-btn"
            disabled={loading || !selectedTime || !selectedPrice}
          >
            {loading ? "Setting..." : "Set Available"}
          </button>

          {/* Selected Date Display */}
          <div className="selected-date-display">
            <p>Selected Date: <strong>{selectedDate.toLocaleDateString([], {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</strong></p>
          </div>

          {/* List of Current Availability Slots */}
          {availability.length > 0 ? (
            <div className="availability-list">
              <h3>Current Availability</h3>
              <ul>
                {availability.map((slot, index) => (
                  <li key={index} className="day-slot">
                    <h4>{slot.fullDate ? `${slot.day} - ${slot.fullDate}` : slot.day}</h4>
                    <ul>
                      {slot.time.map((timeSlot, i) => {
                        try {
                          const datetime = getDatetime(timeSlot);
                          const price = getPrice(timeSlot);
                          return (
                            <li key={i} className="slot-item">
                              <div className="slot-info">
                                <strong>{formatDateDisplay(datetime)}:</strong> {formatTimeDisplay(datetime)}
                                <span className="price-tag">${price}</span>
                              </div>
                              <div className="slot-actions">
                                <button
                                  className="edit-btn"
                                  onClick={(e) => handleEditSlot(slot.day, timeSlot, e)}
                                  disabled={loading}
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="delete-btn"
                                  onClick={() => removeTimeSlot(slot.day, timeSlot)}
                                  disabled={loading}
                                  title="Delete"
                                >
                                  ❌
                                </button>
                              </div>
                            </li>
                          );
                        } catch (e) {
                          console.error("Error rendering time slot:", e);
                          return null;
                        }
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

              <div className="edit-inputs">
                <div className="edit-input-group">
                  <label>New Time:</label>
                  <input
                    type="time"
                    value={updatedTime}
                    onChange={(e) => setUpdatedTime(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="edit-input-group">
                  <label>Price ($):</label>
                  <input
                    type="number"
                    value={updatedPrice}
                    onChange={(e) => setUpdatedPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="edit-buttons">
                <button
                  className="save-btn"
                  onClick={saveUpdatedSlot}
                  disabled={loading || !updatedTime || !updatedPrice}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setEditingSlot(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrainerAvailability;