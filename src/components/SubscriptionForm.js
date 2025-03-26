import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import "./SubscriptionForm.css";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || "");

const PLAN_DETAILS = {
    basic: { 
        bookings: 8, 
        basePrice: 29.99 
    },
    premium: { 
        bookings: 15, 
        basePrice: 49.99 
    },
    pro: { 
        bookings: 25, 
        basePrice: 79.99 
    }
};

const StripeSubscriptionForm = ({ 
    planType, 
    planPrice, 
    endDate, 
    onSubmitSuccess, 
    onError 
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const token = localStorage.getItem("token");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        if (!stripe || !elements) {
            onError("Stripe is not loaded correctly.");
            setLoading(false);
            return;
        }

        try {
            // Create Stripe Payment Method
            const { paymentMethod, error } = await stripe.createPaymentMethod({
                type: "card",
                card: elements.getElement(CardElement),
            });

            if (error) {
                onError(error.message);
                setLoading(false);
                return;
            }

            // Submit subscription with Stripe payment method
            const subscriptionData = { 
                planType, 
                endDate, 
                method: "stripe",
                price: planPrice,
                paymentMethodId: paymentMethod.id
            };

            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/purchase`,
                subscriptionData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Clear card element
            elements.getElement(CardElement).clear();

            // Call success callback
            onSubmitSuccess(response.data.message);
            setLoading(false);
        } catch (error) {
            console.error("Subscription Error:", error.response?.data);
            onError(error.response?.data?.message || "Subscription failed. Try again.");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardElement className="card-element" />
            <button 
                type="submit" 
                disabled={!stripe || loading}
                className="stripe-submit-button"
            >
                {loading ? "Processing..." : `Subscribe - $${planPrice}`}
            </button>
        </form>
    );
};

const SubscriptionForm = () => {
    const [planType, setPlanType] = useState("basic");
    const [endDate, setEndDate] = useState("");
    const [method, setMethod] = useState("stripe");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();
    
    const token = localStorage.getItem("token");
    
    // Dynamic price calculation
    const planPrice = useMemo(() => {
        return PLAN_DETAILS[planType].basePrice;
    }, [planType]);

    // Validation for end date
    const isValidEndDate = (date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        const maxDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
        
        return selectedDate > today && selectedDate <= maxDate;
    };
    
    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);
    
    const handleCashPayment = async () => {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        
        // Validation
        if (!isValidEndDate(endDate)) {
            setErrorMessage("Please select a valid future date within the next 12 months.");
            setLoading(false);
            return;
        }
        
        const subscriptionData = { 
            planType, 
            endDate, 
            method: "cash",
            price: planPrice
        };
        
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/payment/accept-cash-payment`,
                subscriptionData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setSuccessMessage("Cash payment pending. Please complete payment at the gym.");
            setTimeout(() => {
                navigate("/cash-payment-instructions");
            }, 2000);
            
            setLoading(false);
        } catch (error) {
            console.error("Cash Payment Error:", error.response?.data);
            setErrorMessage(error.response?.data?.message || "Payment failed. Try again.");
            setLoading(false);
        }
    };
    
    return (
        <div className="subscription-form-container">
            <h2>Subscribe to a Plan</h2>
            <div className="form-group">
                <label>Select a Plan:</label>
                <select 
                    value={planType} 
                    onChange={(e) => setPlanType(e.target.value)} 
                    required
                >
                    {Object.entries(PLAN_DETAILS).map(([key, plan]) => (
                        <option key={key} value={key}>
                            {key.charAt(0).toUpperCase() + key.slice(1)} - {plan.bookings} Bookings (${plan.basePrice}/month)
                        </option>
                    ))}
                </select>
            </div>
            
            <div className="form-group">
                <label>Subscription End Date:</label>
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                    required 
                />
            </div>
            
            <div className="form-group">
                <label>Payment Method:</label>
                <select 
                    value={method} 
                    onChange={(e) => setMethod(e.target.value)} 
                    required
                >
                    <option value="stripe">Credit Card (Stripe)</option>
                    <option value="cash">Cash (Gym Payment)</option>
                </select>
            </div>
            
            <div className="price-summary">
                <p>Selected Plan: {planType.charAt(0).toUpperCase() + planType.slice(1)}</p>
                <p>Monthly Price: ${planPrice}</p>
            </div>
            
            {method === "stripe" ? (
                <Elements stripe={stripePromise}>
                    <StripeSubscriptionForm 
                        planType={planType}
                        planPrice={planPrice}
                        endDate={endDate}
                        onSubmitSuccess={(message) => {
                            setSuccessMessage(message);
                            setTimeout(() => {
                                navigate("/payments");
                            }, 2000);
                        }}
                        onError={(error) => setErrorMessage(error)}
                    />
                </Elements>
            ) : (
                <button 
                    onClick={handleCashPayment} 
                    disabled={loading}
                >
                    {loading ? "Processing..." : "Submit Cash Payment"}
                </button>
            )}
            
            {errorMessage && <p className="error">{errorMessage}</p>}
            {successMessage && <p className="success">{successMessage}</p>}
        </div>
    );
};

export default SubscriptionForm;