import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import "./SubscriptionForm.css";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || "");

const StripeSubscriptionForm = ({
    planType,
    planPrice,
    onSubmitSuccess,
    onError
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const token = localStorage.getItem("token");
    const [loading, setLoading] = useState(false);

    // Calculate end date (1 month from now)
    const endDate = useMemo(() => {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        return date.toISOString();
    }, []);

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
                method: "stripe", // Payment method is always Stripe now
                transactionId: paymentMethod.id,
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
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [amountDue, setAmountDue] = useState(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const [plans, setPlans] = useState([]);
    const [isSubscriptionButtonDisabled, setIsSubscriptionButtonDisabled] = useState(false);
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    // Calculate end date (1 month from now) for display purposes
    const displayEndDate = useMemo(() => {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }, []);

    // Dynamic price calculation
    const planPrice = useMemo(() => {
        const plan = plans.find(p => p.name === planType);
        return plan ? plan.basePrice : 0;
    }, [planType, plans]);

    useEffect(() => {
        if (!token) {
            navigate("/login");
        } else {
            const fetchPlans = async () => {
                try {
                    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/plans`);
                    setPlans(response.data);
                } catch (error) {
                    console.error("Error fetching plans:", error);
                }
            };
            const fetchAmountDue = async () => {
                try {
                    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payment/amount-due`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    setAmountDue(data.amountDue);
                } catch (err) {
                    console.error("Error fetching amount due:", err);
                }
            };
            const fetchSubscriptionStatus = async () => {
                try {
                    const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/subscription-status`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setSubscriptionStatus(res.data);
                    if (res.data.hasActiveSubscription && res.data.remainingSessions > 0) {
                        setIsSubscriptionButtonDisabled(true);
                    }
                } catch (err) {
                    console.error("Error fetching subscription status:", err);
                }
            };

            fetchAmountDue();
            fetchPlans();
            fetchSubscriptionStatus();
        }
    }, [token, navigate]);

    return (
        <div className="subscription-form-container">
            <h2>Subscribe to a Plan</h2>
            
            {isSubscriptionButtonDisabled && (
                <div className="active-subscription-notice">
                    <p>You already have an active subscription. To change plans, please wait for your current subscription to end.</p>
                </div>
            )}

            <div className="form-group">
                <label>Select a Plan:</label>
                <select
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value)}
                    required
                    disabled={isSubscriptionButtonDisabled}
                >
                    {plans.map((plan) => (
                        <option key={plan.name} value={plan.name}>
                            {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)} - {plan.bookings} Bookings (${plan.basePrice}/month)
                        </option>
                    ))}
                </select>
            </div>

            <div className="subscription-details">
                <div className="subscription-info">
                    <p><strong>Subscription Period:</strong> One month</p>
                    <p><strong>Start Date:</strong> Today</p>
                    <p><strong>End Date:</strong> {displayEndDate}</p>
                </div>

                <div className="price-summary">
                    <p><strong>Selected Plan:</strong> {planType.charAt(0).toUpperCase() + planType.slice(1)}</p>
                    <p><strong>Monthly Price:</strong> ${planPrice}</p>
                </div>
            </div>

            {!isSubscriptionButtonDisabled && (
                <Elements stripe={stripePromise}>
                    <StripeSubscriptionForm
                        planType={planType}
                        planPrice={planPrice}
                        onSubmitSuccess={(message) => {
                            setSuccessMessage(message);
                            setTimeout(() => {
                                navigate("/subscriptions");
                            }, 2000);
                        }}
                        onError={(error) => setErrorMessage(error)}
                    />
                </Elements>
            )}

            {errorMessage && <p className="error">{errorMessage}</p>}
            {successMessage && <p className="success">{successMessage}</p>}
        </div>
    );
};

export default SubscriptionForm;