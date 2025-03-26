import React, { useState, useEffect } from "react";
import axios from "axios";
import "./viewAvailability.css";

const ViewAvailability = () => {
    const [availability, setAvailability] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("availability");

    const token = localStorage.getItem("token");
    const trainerId = localStorage.getItem("trainerId");

    useEffect(() => {
        if (!trainerId) {
            console.error("Trainer ID is missing from localStorage!");
            setError("Trainer ID is missing. Please log in again.");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchAvailability(trainerId),
                    fetchBookings(trainerId),
                    fetchClients()
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [trainerId]);

    // Fetch the trainer's availability
    const fetchAvailability = async (id) => {
        try {
            console.log("📌 Fetching availability for Trainer ID:", id);

            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/trainers/availability/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("✅ Trainer availability data:", response.data);

            if (!response.data || response.data.length === 0) {
                console.warn("⚠️ No availability data found.");
                setAvailability([]);
            } else {
                setAvailability(response.data);
            }
        } catch (error) {
            console.error("❌ Error fetching availability:", error.response?.data || error.message);
            setError("Failed to load availability.");
        }
    };

    // Fetch bookings for the trainer
    const fetchBookings = async (id) => {
        try {
            console.log("📌 Fetching bookings for Trainer ID:", id);

            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/booking/trainer/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("✅ Trainer bookings received:", response.data);

            // ✅ Filter out bookings where `clientId` is missing or sessionTime is undefined
            const validBookings = response.data.filter(booking => {
                if (!booking.clientId) {
                    console.warn(`⚠️ Skipping booking with missing clientId:`, booking);
                    return false;
                }
                if (!booking.sessionTime) {
                    console.warn(`⚠️ Skipping booking with missing sessionTime:`, booking);
                    return false;
                }
                return true;
            });

            setBookings(validBookings);

            // ✅ Extract unique clients from valid bookings
            const uniqueClients = [];
            validBookings.forEach((booking) => {
                if (!uniqueClients.find(client => client._id === booking.clientId._id)) {
                    uniqueClients.push(booking.clientId);
                }
            });

            setClients(uniqueClients);
            console.log("✅ Clients from bookings:", uniqueClients);

        } catch (error) {
            console.error("❌ Error fetching bookings:", error.response?.data || error.message);
            setError("Failed to load bookings.");
        }
    };

    // Fetch clients assigned to the trainer
    const fetchClients = async () => {
        try {
            console.log("📌 Fetching clients");

            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/trainers/trainer/clients`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("✅ Clients data:", response.data);
            setClients(response.data.clients || []);
        } catch (error) {
            console.error("❌ Error fetching clients:", error.response?.data || error.message);
            setError("Failed to load clients.");
        }
    };

    const getClientSessions = (clientId) => {
        const clientBookings = bookings.filter(booking => {
            console.log(`🔍 Checking Booking: ${booking.clientId._id} === ${clientId}`);
            return booking.clientId._id === clientId;
        });

        console.log("✅ Client Sessions Found:", clientBookings);
        return clientBookings;
    };

    // Mark a session as completed
    const markSessionComplete = async (bookingId) => {
        try {
            await axios.put(
                `${process.env.REACT_APP_BACKEND_URL}/api/booking/booking/${bookingId}/complete`,
                { completed: true },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update the booking in the state
            setBookings(prevBookings =>
                prevBookings.map(booking =>
                    booking._id === bookingId
                        ? { ...booking, completed: true }
                        : booking
                )
            );

            console.log("✅ Session marked as completed");
        } catch (error) {
            console.error("❌ Error marking session as complete:", error.response?.data || error.message);
            alert("Failed to mark session as complete.");
        }
    };

    // Get client name by ID
    const getClientName = (clientId) => {
        if (!clientId) {
            console.warn(`⚠️ Missing clientId:`, clientId);
            return "Unknown Client";
        }

        if (typeof clientId === "string") {
            console.warn(`⚠️ clientId is a string. Expected object. Looking up...`);
            return clients.find(c => c._id === clientId)?.username || "Unknown Client";
        }

        return clientId.username ? clientId.username : "Unknown Client";
    };

    // Format date for display
    const formatDateTime = (dateTime) => {
        if (!dateTime) {
            console.warn("⚠️ Missing sessionTime, returning 'No Date'.");
            return "No Date";
        }

        let parsedDate = new Date(dateTime);

        if (isNaN(parsedDate.getTime())) {
            console.error("❌ Invalid sessionTime format received:", dateTime);
            return "Invalid Date";
        }

        return parsedDate.toLocaleString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    return (
        <div className="va-container">
            <h1 className="va-title">Trainer Dashboard</h1>

            <div className="va-tabs">
                <button
                    className={`va-tab ${activeTab === "availability" ? "active" : ""}`}
                    onClick={() => setActiveTab("availability")}
                >
                    Available Slots
                </button>
                <button
                    className={`va-tab ${activeTab === "bookings" ? "active" : ""}`}
                    onClick={() => setActiveTab("bookings")}
                >
                    Booked Sessions
                </button>
                <button
                    className={`va-tab ${activeTab === "clients" ? "active" : ""}`}
                    onClick={() => setActiveTab("clients")}
                >
                    Client List
                </button>
            </div>

            {loading ? (
                <p className="va-loading">Loading data...</p>
            ) : error ? (
                <p className="va-error">{error}</p>
            ) : (
                <div className="va-content">
                    {activeTab === "availability" && (
                        <div className="va-availability-section">
                            <h3>Your Available Slots</h3>
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
                                <p className="va-no-slots">No available slots. Please set your availability.</p>
                            )}
                        </div>
                    )}

                    {activeTab === "bookings" && (
                        <div className="va-bookings-section">
                            <h3>Your Booked Sessions</h3>
                            {bookings.length > 0 ? (
                                <div className="va-bookings-list">
                                    {bookings.map((booking) => (
                                        <div key={booking._id} className={`va-booking-card ${booking.completed ? "completed" : ""}`}>
                                            <div className="va-booking-header">
                                                <h4>Session with {getClientName(booking.clientId)}</h4>
                                                <span className={`va-status ${booking.completed ? "completed" : "upcoming"}`}>
                                                    {booking.completed ? "Completed" : "Upcoming"}
                                                </span>
                                            </div>

                                            <div className="va-booking-details">
                                                <p><i className="fas fa-calendar"></i> {formatDateTime(booking.sessionTime)}</p>
                                            </div>

                                            {!booking.completed && (
                                                <button
                                                    className="va-mark-complete"
                                                    onClick={() => markSessionComplete(booking._id)}
                                                >
                                                    Mark as Completed
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="va-no-bookings">No booked sessions.</p>
                            )}
                        </div>
                    )}


                    {activeTab === "clients" && (
                        <div className="va-clients-section">
                            <h3>Your Clients</h3>
                            {clients.length > 0 ? (
                                <div className="va-clients-list">
                                    {clients.map((client) => (
                                        <div key={client._id} className="va-client-card">
                                            <h4>{client.username}</h4>
                                            <p><i className="fas fa-envelope"></i> {client.email}</p>
                                            {client.phoneNumber && <p><i className="fas fa-phone"></i> {client.phoneNumber}</p>}

                                            {/* Display client sessions */}
                                            <div className="va-client-sessions">
                                                <h5>Sessions:</h5>
                                                {getClientSessions(client._id).length > 0 ? (
                                                    <ul>
                                                        {getClientSessions(client._id).map(booking => (
                                                            <li key={booking._id} className={booking.completed ? "completed" : ""}>
                                                                {formatDateTime(booking.sessionTime)}
                                                                {booking.completed && <span className="va-completed-badge">✓</span>}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p>No sessions booked</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="va-no-clients">No clients assigned to you yet.</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ViewAvailability;