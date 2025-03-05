import React, { useState, useEffect } from "react";
import axios from "axios";
import "./bookingsPage.css";

const BookingsPage = () => {
    const [trainers, setTrainers] = useState([]);
    const [selectedTrainer, setSelectedTrainer] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [userRole, setUserRole] = useState(localStorage.getItem("role") || "");
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (userRole === "client") {
            fetchTrainers();
            fetchBookings();
        }
    }, [userRole]);

    // ✅ Fetch available trainers
    const fetchTrainers = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/trainers/trainers", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTrainers(response.data);
        } catch (error) {
            console.error("Error fetching trainers:", error);
        }
    };

    // ✅ Fetch client bookings
    const fetchBookings = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/booking/bookings", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBookings(response.data);
        } catch (error) {
            console.error("Error fetching bookings:", error);
        }
    };

    // ✅ Fetch trainer availability when a trainer is selected
    const fetchTrainerAvailability = async (trainerId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/trainers/availability/${trainerId}`);
            setSelectedTrainer(prevTrainer => ({ ...prevTrainer, availability: response.data.availableSlots }));
        } catch (error) {
            console.error("Error fetching trainer availability:", error);
        }
    };    

    // ✅ Handle trainer selection
    const handleSelectTrainer = (trainer) => {
        setSelectedTrainer(trainer);
        fetchTrainerAvailability(trainer._id);
    };

    // ✅ Handle session booking
    const handleBookSession = async (trainerId, day, time) => {
        if (!trainerId || !time) {
            alert("Trainer ID and session time are required.");
            return;
        }
    
        const requestData = {
            trainerId,
            clientId: localStorage.getItem("userId"),
            sessionTime: new Date(time).toISOString(), // Ensuring correct format
        };
    
        console.log("📌 Booking Session Request Data:", requestData); // Debugging log
    
        try {
            const response = await axios.post(
                "http://localhost:5000/api/booking/book-session",
                requestData,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                }
            );
    
            alert("✅ Session booked successfully!");
            fetchBookings(); // Refresh booked sessions
        } catch (error) {
            console.error("❌ Error booking session:", error.response?.data || error.message);
            alert(`⚠️ Booking failed: ${error.response?.data?.message || "Check request data."}`);
        }
    };
    

    return (
        <div className="bp-bookings-page">
            <h1 className="bp-page-title">Book Your Session</h1>

            {userRole === "client" && (
                <div className="bp-trainers-list">
                    {trainers.map((trainer) => (
                        <div key={trainer._id} className="bp-trainer-card">
                            <h3>{trainer.username}</h3>
                            <p>Specialties: {trainer.specialties.join(", ")}</p>
                            <button onClick={() => handleSelectTrainer(trainer)}>View Availability</button>
                        </div>
                    ))}
                </div>
            )}

            {selectedTrainer && (
                <div className="bp-selected-trainer">
                    <h2>Availability for {selectedTrainer.username}</h2>
                    {selectedTrainer.availability ? (
                        <div className="bp-availability-list">
                            {selectedTrainer.availability.map((slot, index) => (
                                <div key={index} className="bp-availability-item">
                                    <strong>{slot.day}:</strong>
                                    {slot.time.map((time, i) => (
                                        <button key={i} onClick={() => handleBookSession(selectedTrainer._id, slot.day, time)}>
                                        {new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </button>                                    
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Loading availability...</p>
                    )}
                </div>
            )}

            <div className="bp-bookings-list">
                <h2>Your Bookings</h2>
                {bookings.length === 0 ? (
                    <p>No upcoming bookings.</p>
                ) : (
                    <ul>
                        {bookings.map((booking) => (
                            <li key={booking._id}>
                                {booking.trainerId.username} - {new Date(booking.sessionTime).toLocaleString()}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default BookingsPage;
