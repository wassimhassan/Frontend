import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SubscriptionForm.css"; 

const SubscriptionForm = () => {
    const [planType, setPlanType] = useState("basic"); // Default subscription type
    const [endDate, setEndDate] = useState("");
    const [method, setMethod] = useState("stripe"); // Default payment method
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login"); // Redirect to login if not authenticated
        }
    }, [token, navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
    
        // 🔹 Validate endDate before sending request
        if (!endDate || new Date(endDate) <= new Date()) {
            setErrorMessage("Please select a valid future date.");
            setLoading(false);
            return;
        }
    
        const subscriptionData = { planType, endDate, method };
        console.log("📌 Sending Subscription Request:", subscriptionData); // Debugging
    
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/purchase`,
                subscriptionData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            console.log("✅ Subscription Successful:", response.data);
            setSuccessMessage(response.data.message);
            setLoading(false);
    
            setTimeout(() => {
                navigate("/payments");
            }, 2000);
        } catch (error) {
            console.error("❌ Subscription Error:", error.response?.data);
            setErrorMessage(error.response?.data?.message || "Subscription failed. Try again.");
            setLoading(false);
        }
    };
    

    return (
        <div className="subscription-container">
            <h2>Subscribe to a Plan</h2>
            <form onSubmit={handleSubmit}>
                <label>Select a Plan:</label>
                <select value={planType} onChange={(e) => setPlanType(e.target.value)} required>
                    <option value="basic">Basic - 8 Bookings</option>
                    <option value="premium">Premium - 15 Bookings</option>
                    <option value="pro">Pro - 25 Bookings</option>
                </select>

                <label>Subscription End Date:</label>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                />

                <label>Payment Method:</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} required>
                    <option value="stripe">Credit Card (Stripe)</option>
                    <option value="cash">Cash (Gym Payment)</option>
                </select>

                <button type="submit" disabled={loading}>
                    {loading ? "Processing..." : "Subscribe"}
                </button>

                {loading && <div className="loading">Processing...</div>}
                {errorMessage && <div className="error">{errorMessage}</div>}
                {successMessage && <div className="success">{successMessage}</div>}
            </form>
        </div>
    );
};

export default SubscriptionForm;
