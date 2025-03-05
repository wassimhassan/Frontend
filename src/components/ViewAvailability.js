import React, { useState, useEffect } from "react";
import axios from "axios";
import "./viewAvailability.css"; // Ensure you have a CSS file for styling

const ViewAvailability = () => {
    const [availability, setAvailability] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const token = localStorage.getItem("token");
    const trainerId = localStorage.getItem("trainerId"); // ✅ Fetch logged-in trainer ID

    useEffect(() => {
        if (!trainerId) {
            console.error("Trainer ID is missing from localStorage!");
            setError("Trainer ID is missing. Please log in again.");
            setLoading(false);
            return;
        }

        fetchAvailability(trainerId);
    }, [trainerId]);

    // ✅ Fetch the trainer's availability
    const fetchAvailability = async (id) => {
        try {
            console.log("📌 Fetching availability for Trainer ID:", id);

            const response = await axios.get(`http://localhost:5000/api/trainers/availability/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("✅ Trainer availability data:", response.data);

            if (!response.data || response.data.length === 0) {
                console.warn("⚠️ No availability data found.");
                setAvailability(null);
            } else {
                setAvailability(response.data);
            }
        } catch (error) {
            console.error("❌ Error fetching availability:", error.response?.data || error.message);
            setError("Failed to load availability.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="va-container">
            <h1 className="va-title">Your Availability</h1>

            {loading ? (
                <p className="va-loading">Loading availability...</p>
            ) : error ? (
                <p className="va-error">{error}</p>
            ) : !availability ? (
                <p className="va-no-data">You have not set any availability yet.</p>
            ) : (
                <div className="va-trainer-card">
                    <h3>Your Availability</h3>
                    <h4>Available Slots:</h4>
                    {availability.length > 0 ? (
                        <ul className="va-availability-list">
                            {availability.map((slot, index) => (
                                <li key={index} className="va-slot">
                                    <strong>{slot.day}:</strong>{" "}
                                    {slot.time.map((time, i) => (
                                        <span key={i} className="va-time">
                                            {new Date(time).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    ))}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="va-no-slots">No available slots.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ViewAvailability;
