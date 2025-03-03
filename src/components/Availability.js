import React, { useState, useEffect } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Availability.css";



const TrainerAvailability = ({ trainerId }) => {
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/availability?trainerId=${trainerId}`
      );
      setAvailability(response.data);
    } catch (error) {
      console.error("Error fetching availability", error);
    }
  };

  const updateAvailability = async () => {
    try {
      const response = await axios.put("http://localhost:5000/api/availability", {
        trainerId,
        date: selectedDate,
      });
      setAvailability([...availability, response.data]);
    } catch (error) {
      console.error("Error updating availability", error);
    }
  };

  return (
    <div className="availability-container">
      <h2>Manage Availability</h2>
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        tileClassName={({ date }) =>
          availability.find((d) => new Date(d.date).toDateString() === date.toDateString())
            ? "available-day"
            : ""
        }
      />
      <button onClick={updateAvailability} className="update-btn">
        Set Available
      </button>
    </div>
  );
};
<div className="date-time-container">
   <label>Month:</label>
   <select>
      <option>January</option>
      <option>February</option>
      <option>March</option>
      <option>April</option>
      <option>May</option>
      <option>June</option>
      <option>July</option>
      <option>August</option>
      <option>September</option>
      <option>October</option>
      <option>November</option>
      <option>December</option>
   </select>

   <label>Year:</label>
   <select>
      {[...Array(10)].map((_, i) => (
         <option key={i}>{new Date().getFullYear() + i}</option>
      ))}
   </select>
</div>


export default TrainerAvailability;
