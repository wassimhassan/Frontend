import React, { useState, useEffect } from "react";
import axios from "axios";
import "./bookingsPage.css";

const BookingsPage = () => {
    const [trainers, setTrainers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");
    const clientId = localStorage.getItem("userId");

    useEffect(() => {
        fetchTrainersWithAvailability();
        fetchClientBookings();
    }, []);

    // ✅ Fetch all trainers with their availability
    const fetchTrainersWithAvailability = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/trainers/trainers", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const trainersData = await Promise.all(
                response.data.map(async (trainer) => {
                    try {
                        const availabilityResponse = await axios.get(
                            `http://localhost:5000/api/trainers/availability/${trainer._id}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );

                        return {
                            ...trainer,
                            availability: availabilityResponse.data.map(slot => ({
                                day: slot.day,
                                time: slot.time.map(t => new Date(t)), // Convert time strings to Date objects
                            })),
                        };
                    } catch (error) {
                        console.error(`Error fetching availability for ${trainer.username}:`, error.response?.data || error.message);
                        return { ...trainer, availability: [] };
                    }
                })
            );

            setTrainers(trainersData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching trainers:", error);
            setError("Failed to load trainers.");
            setLoading(false);
        }
    };

    // ✅ Fetch client bookings
    const fetchClientBookings = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/booking/bookings", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setBookings(response.data);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            setError("Failed to load your bookings.");
        }
    };

    // ✅ Check if a session is already booked
    const isSessionBooked = (trainerId, sessionTime) => {
        return bookings.some(
            (booking) =>
                booking.trainerId._id === trainerId &&
                new Date(booking.sessionTime).getTime() === new Date(sessionTime).getTime()
        );
    };

    // ✅ Handle selecting a session (shows "Book" button)
    const handleSelectSession = (trainerId, day, time) => {
        if (isSessionBooked(trainerId, time)) return; // Prevent selecting booked slots
        setSelectedSession({ trainerId, day, time });
    };

    // ✅ Handle session booking
    const handleBookSession = async () => {
        if (!selectedSession) {
            alert("Please select a session before booking.");
            return;
        }

        const { trainerId, time } = selectedSession;

        if (isSessionBooked(trainerId, time)) {
            alert("⚠️ This session is already booked.");
            return;
        }

        const confirmBooking = window.confirm(
            `Are you sure you want to book a session with this trainer on ${time.toLocaleString()}?`
        );

        if (!confirmBooking) return;

        const requestData = {
            trainerId,
            clientId,
            sessionTime: new Date(time).toISOString(),
        };

        try {
            await axios.post("http://localhost:5000/api/booking/book-session", requestData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert("✅ Session booked successfully!");
            fetchClientBookings();
            setSelectedSession(null); // Reset selection after booking
        } catch (error) {
            console.error("Error booking session:", error.response?.data || error.message);
            alert(`⚠️ Booking failed: ${error.response?.data?.message || "Check request data."}`);
        }
    };

    return (
        <div className="bp-bookings-page">
            <h1 className="bp-page-title">Book Your Training Session</h1>

            {/* ✅ Trainer List */}
            <div className="bp-trainers-list">
                {loading ? (
                    <p>Loading trainers...</p>
                ) : error ? (
                    <p className="bp-error">{error}</p>
                ) : (
                    trainers.map((trainer) => (
                        <div key={trainer._id} className="bp-trainer-card">
                            <h3>{trainer.username}</h3>
                            <p>Specialties: {trainer.specialties.join(", ")}</p>

                            {trainer.availability.length > 0 ? (
                                <div className="bp-availability-list">
                                    {trainer.availability.map((slot, index) => (
                                        <div key={index} className="bp-availability-item">
                                            <strong>{slot.day}:</strong>
                                            {slot.time.length > 0 ? (
                                                slot.time.map((time, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleSelectSession(trainer._id, slot.day, time)}
                                                        className={`bp-availability-button ${isSessionBooked(trainer._id, time) ? "bp-booked" : ""}`}
                                                        disabled={isSessionBooked(trainer._id, time)}
                                                    >
                                                        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        {isSessionBooked(trainer._id, time) && " (Booked)"}
                                                    </button>
                                                ))
                                            ) : (
                                                <p>No available slots</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No available slots</p>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* ✅ Book Button (Appears after selecting a session) */}
            {selectedSession && (
                <div className="bp-confirm-booking">
                    <h3>Selected Session:</h3>
                    <p>
                        Trainer ID: {selectedSession.trainerId} <br />
                        Time: {selectedSession.time.toLocaleString()}
                    </p>
                    <button className="bp-book-button" onClick={handleBookSession}>
                        Confirm Booking
                    </button>
                </div>
            )}

            {/* ✅ Bookings List */}
            <div className="bp-bookings-list">
                <h2>Your Bookings</h2>
                {bookings.length === 0 ? (
                    <p>No upcoming bookings.</p>
                ) : (
                    <ul>
                        {bookings.map((booking) => (
                            <li key={booking._id}>
                                <strong>{booking.trainerId.username}</strong> - {new Date(booking.sessionTime).toLocaleString()}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default BookingsPage;
