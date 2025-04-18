import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, Elements, useStripe, useElements } from "@stripe/react-stripe-js";
import "./bookingsPage.css";

// Load Stripe outside of component to avoid recreating it on re-renders
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

// Payment form component
const PaymentForm = ({ amount, bookingId, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        if (!stripe || !elements) {
            setError("Stripe has not loaded yet. Please try again.");
            setLoading(false);
            return;
        }

        // Create payment method
        const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
            type: "card",
            card: elements.getElement(CardElement),
        });

        if (stripeError) {
            setError(stripeError.message);
            setLoading(false);
            return;
        }

        try {
            const paymentData = {
                amount,
                paymentMethodId: paymentMethod.id,
                // Include booking ID if we're paying for a specific booking
                ...(bookingId && { bookingId: bookingId })
            };
            // Process payment with backend
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/payment/stripe`,
                paymentData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Handle successful payment - fix to safely handle response
            if (response && response.data) {
                onSuccess(response.data);
            } else {
                // Handle empty but successful response
                onSuccess({ success: true });
            }
            setLoading(false);
        } catch (error) {
            console.error("❌ Payment Failed:", error);
            // Safer error handling
            const errorMessage = error.response?.data?.error ||
                error.message ||
                "Payment processing failed";
            setError(errorMessage);
            onError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bp-payment-form">
            <div className="bp-card-element-container">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                            invalid: {
                                color: '#9e2146',
                            },
                        },
                    }}
                />
            </div>

            {error && <div className="bp-payment-error">{error}</div>}

            <button
                type="submit"
                className="bp-pay-button"
                disabled={!stripe || loading}
            >
                {loading ? "Processing..." : `Pay $${amount}`}
            </button>
        </form>
    );
};

const BookingsPage = () => {
    const [trainers, setTrainers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);
    const [selectedTrainer, setSelectedTrainer] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [bookingStep, setBookingStep] = useState(1); // 1: Select Trainer, 2: Pick Date/Time, 3: Payment
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [showStripeForm, setShowStripeForm] = useState(false);
    const [currentBookingId, setCurrentBookingId] = useState(null);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [outstandingPayment, setOutstandingPayment] = useState(0);
    const token = localStorage.getItem("token");
    const clientId = localStorage.getItem("userId");
    const [showSubscriptionChoice, setShowSubscriptionChoice] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTrainersWithAvailability();
        fetchClientBookings();
        checkSubscriptionStatus();
        fetchOutstandingPayments();
    }, []);

    // Check if user has an active subscription
    const checkSubscriptionStatus = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/subscription-status`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("Subscription status response:", response.data);

            if (response.data.hasActiveSubscription) {
                setHasActiveSubscription(true);
                setSubscriptionDetails({
                    ...response.data.subscription,
                    sessionsRemaining: response.data.remainingSessions, 
                    totalSessions: response.data.subscription.maxBookingsPerMonth
                });
            } else {
                setHasActiveSubscription(false);
                setSubscriptionDetails(null);
            }
        } catch (error) {
            console.error("Error checking subscription status:", error);
            setHasActiveSubscription(false);
            setSubscriptionDetails(null);
        }
    };

    // Fetch outstanding payment amount
    const fetchOutstandingPayments = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/payment/amount-due`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            console.log("Outstanding payment response:", response.data);
            if (response.data && response.data.amountDue) {
                setOutstandingPayment(response.data.amountDue);
            }
            
            // Also fetch pending payments
            const paymentsResponse = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/payment/history`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (paymentsResponse.data && paymentsResponse.data.payments) {
                const pending = paymentsResponse.data.payments.filter(p => p.status === 'pending');
                setPendingPayments(pending);
            }
        } catch (error) {
            console.error("Error fetching outstanding payments:", error);
        }
    };

    // Fetch all trainers with their availability
    const fetchTrainersWithAvailability = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/trainers/trainers`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const trainersData = await Promise.all(
                response.data.map(async (trainer) => {
                    try {
                        const availabilityResponse = await axios.get(
                            `${process.env.REACT_APP_BACKEND_URL}/api/trainers/availability/${trainer._id}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );

                        // Process availability data to include session prices
                        let availability = [];
                        
                        if (Array.isArray(availabilityResponse.data)) {
                            // Handle array format
                            availability = availabilityResponse.data.map(slot => ({
                                day: slot.day,
                                time: slot.time.map(t => ({
                                    datetime: new Date(typeof t === 'object' ? t.datetime : t),
                                    price: typeof t === 'object' ? t.price : (trainer.sessionPrice || 10)
                                })),
                            }));
                        } else if (availabilityResponse.data.availability && Array.isArray(availabilityResponse.data.availability)) {
                            // Handle { availability: [...] } format
                            availability = availabilityResponse.data.availability.map(slot => ({
                                day: slot.day,
                                time: slot.time.map(t => ({
                                    datetime: new Date(typeof t === 'object' ? t.datetime : t),
                                    price: typeof t === 'object' ? t.price : (trainer.sessionPrice || 10)
                                })),
                            }));
                        } else {
                            console.warn("Unexpected availability format:", availabilityResponse.data);
                            availability = [];
                        }

                        return {
                            ...trainer,
                            availability,
                            sessionPrice: trainer.sessionPrice || (availability[0]?.time[0]?.price || 10)
                        };
                    } catch (error) {
                        // Silently handle 404 errors for missing availability
                        if (error.response?.status === 404) {
                            return { ...trainer, availability: [], sessionPrice: trainer.sessionPrice || 10 };
                        }
                        // Log other errors but don't show them to the user
                        console.error(`Error fetching availability for ${trainer?.username || trainer?._id || "unknown"}:`,
                            error.response?.data || error.message);
                        return { ...trainer, availability: [], sessionPrice: trainer.sessionPrice || 10 };
                    }
                })
            );

            // Filter out trainers with no availability
            const availableTrainers = trainersData.filter(trainer => trainer.availability.length > 0);

            if (availableTrainers.length === 0) {
                setError('No trainers have set their availability yet. Please check back later.');
            } else {
                setError(null);
            }

            console.log("Available trainers:", availableTrainers);
            setTrainers(availableTrainers);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching trainers:', error);
            setError('Failed to load trainers');
            setLoading(false);
        }
    };

    // Fetch client bookings
    const fetchClientBookings = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/booking/bookings`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const result = response.data;

            // Make sure it's an array
            if (Array.isArray(result)) {
                setBookings(result);
            } else if (result.bookings && Array.isArray(result.bookings)) {
                // Handle API that returns an object with bookings array
                setBookings(result.bookings);
            } else {
                setBookings([]); // fallback to empty list
                console.warn("Bookings data is not an array:", result);
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
            setError("Failed to load your bookings.");
        }
    };

    // Check if a session is already booked
    const isSessionBooked = (trainerId, sessionTime) => {
        return bookings.some((booking) => {
            const bookingTrainerId = booking.trainerId?._id || booking.trainerId;
            const bookingTime = new Date(booking.sessionTime).getTime();
            const compareTime = sessionTime instanceof Date ? 
                sessionTime.getTime() : 
                new Date(sessionTime).getTime();
                
            return bookingTrainerId === trainerId && bookingTime === compareTime;
        });
    };

    // Check if a session time is in the past
    const isSessionInPast = (sessionTime) => {
        const now = new Date();
        const sessionDate = sessionTime instanceof Date ? 
            sessionTime : 
            new Date(sessionTime);
            
        return sessionDate < now;
    };

    // Check if a session is available (not booked and not in the past)
    const isSessionAvailable = (trainerId, sessionTime) => {
        return !isSessionBooked(trainerId, sessionTime) && !isSessionInPast(sessionTime);
    };

    // Handle selecting a trainer
    const handleSelectTrainer = (trainer) => {
        setSelectedTrainer(trainer);
        setBookingStep(2);
        setSelectedSession(null);
    };

    const handleSelectSession = (trainerId, day, session) => {
        if (!isSessionAvailable(trainerId, session.datetime)) return;

        setSelectedSession({ 
            trainerId, 
            day, 
            time: session.datetime,
            price: session.price 
        });

        // If user has an active subscription with remaining sessions, show subscription choice modal
        if (hasActiveSubscription && subscriptionDetails && subscriptionDetails.sessionsRemaining > 0) {
            setShowSubscriptionChoice(true);
        } else {
            setBookingStep(3); // Go directly to payment step
        }
    };

    // Toggle Stripe form visibility
    const toggleStripeForm = () => {
        setShowStripeForm(!showStripeForm);
    };

    // Handle payment success
    const handlePaymentSuccess = (paymentData) => {
        setPaymentSuccess(true);
        setPaymentProcessing(false);
        completeBooking("creditCard");
        
        // Refresh outstanding payments data
        fetchOutstandingPayments();
    };

    // Handle payment error
    const handlePaymentError = (errorMessage) => {
        setError(errorMessage);
        setPaymentProcessing(false);
    };

    // Complete booking after successful payment or with subscription
    const completeBooking = async (finalPaymentMethod) => {
        if (!selectedSession) {
            alert("Please select a session before booking.");
            return;
        }
      
        const { trainerId, time, price } = selectedSession;
      
        if (!isSessionAvailable(trainerId, time)) {
            alert("⚠️ This session is no longer available.");
            return;
        }
      
        // Create a Date object from the time
        const sessionDate = new Date(time);
      
        // Format data properly to match backend expectations
        const requestData = {
            trainerId,
            sessionTime: sessionDate.toISOString(),
            paymentMethod: finalPaymentMethod || paymentMethod,
            sessionPrice: price // Include session price
        };
      
        try {
            console.log("Sending booking request:", requestData);
          
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/booking/book-session`,
                requestData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
      
            // Update subscription details if using subscription
            if (finalPaymentMethod === "subscription" && response.data.subscription) {
                setSubscriptionDetails(response.data.subscription);
            }
      
            alert(`✅ ${response.data.message}`);
            fetchClientBookings();
            checkSubscriptionStatus();
            fetchOutstandingPayments(); // Refresh payment data
            resetBookingProcess();
        } catch (error) {
            console.error("Error booking session:", error.response?.data || error.message);
            alert(`⚠️ Booking failed: ${error.response?.data?.message || "Check request data."}`);
        }
    };

    // Handle session booking with payment
    const handleBookSession = async () => {
        if (!selectedSession || !paymentMethod) {
            alert("Please select a session and payment method before booking.");
            return;
        }

        // For "Pay at Gym" option, directly complete the booking
        if (paymentMethod === "inPerson") {
            completeBooking("inPerson");
            return;
        }

        // For "Credit Card" option, show Stripe form
        if (paymentMethod === "creditCard") {
            setShowStripeForm(true);
            return;
        }

        // For "Use Subscription" option
        if (paymentMethod === "subscription") {
            if (!subscriptionDetails || subscriptionDetails.sessionsRemaining <= 0) {
                alert("⚠️ You don't have any sessions remaining in your subscription.");
                return;
            }
            completeBooking("subscription");
            return;
        }
    };

    // Reset booking process
    const resetBookingProcess = () => {
        setSelectedTrainer(null);
        setSelectedSession(null);
        setPaymentMethod("");
        setBookingStep(1);
        setPaymentSuccess(false);
        setShowStripeForm(false);
        setCurrentBookingId(null);
    };

    // Format date for display - enhanced with detailed date
    const formatDate = (date) => {
        if (!date) return "";
        
        const dateObj = date instanceof Date ? date : new Date(date);
        
        if (isNaN(dateObj.getTime())) {
            return "Invalid date";
        }
        
        return dateObj.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format time without the full date
    const formatTime = (date) => {
        if (!date) return "";
        
        const dateObj = date instanceof Date ? date : new Date(date);
        
        if (isNaN(dateObj.getTime())) {
            return "Invalid time";
        }
        
        return dateObj.toLocaleTimeString([], { 
            hour: "2-digit", 
            minute: "2-digit" 
        });
    };

    // Calculate session cost - now using the session's price from the backend
    const getSessionCost = () => {
        if (!selectedSession) return 0;

        // Get base price from the selected session
        const basePrice = selectedSession.price || 10;

        // Apply discount if using subscription
        if (paymentMethod === "subscription" && subscriptionDetails) {
            const discountPercent = subscriptionDetails.sessionDiscount || 0;
            return (basePrice * (1 - discountPercent / 100)).toFixed(2);
        }

        return basePrice;
    };

    return (
        <div className="bp-bookings-page">
            <h1 className="bp-page-title">Book Your Training Session</h1>

            {/* Progress Steps */}
            <div className="bp-booking-steps">
                <div className={`bp-step ${bookingStep >= 1 ? 'bp-step-active' : ''}`}>1. Select Trainer</div>
                <div className={`bp-step ${bookingStep >= 2 ? 'bp-step-active' : ''}`}>2. Pick Date & Time</div>
                <div className={`bp-step ${bookingStep >= 3 ? 'bp-step-active' : ''}`}>3. Confirm Payment</div>
            </div>

            {/* Subscription Status */}
            {hasActiveSubscription && (
                <div className="bp-subscription-status">
                    <h3>📅 Your Subscription Plan: {subscriptionDetails?.planType || 'Basic'}</h3>
                    <p>Sessions remaining this month: <strong>{subscriptionDetails?.sessionsRemaining || 0}</strong> / {subscriptionDetails?.totalSessions || 0}</p>
                    <p>Valid until: <strong>{formatDate(subscriptionDetails?.endDate)}</strong></p>
                </div>
            )}

            {/* Step 1: Select Trainer */}
            {bookingStep === 1 && (
                <div className="bp-trainer-selection">
                    <h2>Choose a Trainer</h2>
                    {loading ? (
                        <p>Loading trainers...</p>
                    ) : error ? (
                        <p className="bp-error">{error}</p>
                    ) : trainers.length > 0 ? (
                        <div className="bp-trainers-grid">
                            {trainers.map((trainer) => (
                                <div
                                    key={trainer._id}
                                    className="bp-trainer-card"
                                    onClick={() => handleSelectTrainer(trainer)}
                                >
                                    <div className="bp-trainer-photo">
                                        {trainer.profilePhoto ? (
                                            <img src={trainer.profilePhoto} alt={trainer.username} />
                                        ) : (
                                            <div className="bp-trainer-placeholder">{trainer.username.charAt(0)}</div>
                                        )}
                                    </div>
                                    <h3>{trainer.username}</h3>
                                    <p className="bp-trainer-specialties">
                                        <strong>Specialties:</strong> {trainer.specialties?.join(", ") || "General Fitness"}
                                    </p>
                                    <p className="bp-trainer-experience">
                                        <strong>Experience:</strong> {trainer.yearsOfExperience || "N/A"} years
                                    </p>
                                    <p className="bp-trainer-rate">
                                        <strong>Rate:</strong> ${trainer.sessionPrice || 10}/session
                                    </p>
                                    <button className="bp-select-button">Select</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bp-no-trainers">
                            <p>No trainers are currently available. Please check back later.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Pick Date & Time */}
            {bookingStep === 2 && selectedTrainer && (
                <div className="bp-date-time-selection">
                    <h2>Select Date & Time with {selectedTrainer.username}</h2>
                    <button className="bp-back-button" onClick={() => setBookingStep(1)}>
                        ← Back to Trainers
                    </button>

                    <div className="bp-date-info">
                        <p>Please select from available time slots. Unavailable slots are either already booked or past.</p>
                    </div>

                    {showSubscriptionChoice && (
                        <div className="bp-subscription-modal">
                            <div className="bp-subscription-content">
                                <h3>How would you like to proceed?</h3>
                                <p>You have an active subscription! You can use it for this booking or pay separately.</p>

                                <div className="bp-subscription-info">
                                    <p>Your subscription plan: <strong>{subscriptionDetails?.planType || 'Basic'}</strong></p>
                                    <p>Sessions remaining this month: <strong>{subscriptionDetails?.sessionsRemaining || 0}</strong></p>
                                </div>

                                <div className="bp-subscription-buttons">
                                    <button
                                        className="bp-subscribe-button"
                                        onClick={() => {
                                            setPaymentMethod("subscription");
                                            setShowSubscriptionChoice(false);
                                            setBookingStep(3);
                                        }}
                                    >
                                        Use Subscription
                                    </button>

                                    <button
                                        className="bp-per-session-button"
                                        onClick={() => {
                                            setShowSubscriptionChoice(false);
                                            setBookingStep(3);
                                        }}
                                    >
                                        Pay Per Session
                                    </button>
                                </div>

                                <button
                                    className="bp-cancel-subscription-choice"
                                    onClick={() => {
                                        setShowSubscriptionChoice(false);
                                        setSelectedSession(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {selectedTrainer.availability.length > 0 ? (
                        <div className="bp-availability-calendar">
                            {selectedTrainer.availability.map((slot, index) => {
                                // Check if the slot has any available times
                                const hasAvailableTimes = slot.time && slot.time.length > 0 &&
                                    slot.time.some(time => isSessionAvailable(selectedTrainer._id, time.datetime));

                                // Skip days with no available times
                                if (!hasAvailableTimes) return null;

                                // Get the date for the first available time slot to show full date
                                const slotDate = slot.time.length > 0 ? slot.time[0].datetime : new Date();

                                return (
                                    <div key={index} className="bp-day-column">
                                        <h3 className="bp-day-header">
                                            {slot.day} - {formatDate(slotDate)}
                                        </h3>
                                        <div className="bp-time-slots">
                                            {slot.time && slot.time.length > 0 ? (
                                                slot.time.map((timeSlot, i) => {
                                                    // Skip if the session time is invalid
                                                    if (!timeSlot || !timeSlot.datetime) return null;
                                                    
                                                    // Check if session is in the past
                                                    const isPast = isSessionInPast(timeSlot.datetime);

                                                    // Check if session is booked
                                                    const isBooked = isSessionBooked(selectedTrainer._id, timeSlot.datetime);

                                                    // Skip past sessions completely
                                                    if (isPast) return null;

                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleSelectSession(selectedTrainer._id, slot.day, timeSlot)}
                                                            className={`bp-time-slot ${isBooked ? "bp-booked" : ""}`}
                                                            disabled={isBooked}
                                                        >
                                                            <div className="bp-time-display">
                                                                {formatTime(timeSlot.datetime)}
                                                            </div>
                                                            <div className="bp-price-display">
                                                                ${timeSlot.price || selectedTrainer.sessionPrice || 10}
                                                            </div>
                                                            {isBooked && <div className="bp-booked-badge">Booked</div>}
                                                        </button>
                                                    );
                                                }).filter(Boolean)  // Remove null items
                                            ) : (
                                                <p className="bp-no-slots">No available slots</p>
                                            )}

                                            {/* Show this if all slots were filtered out due to being in the past */}
                                            {slot.time && slot.time.length > 0 &&
                                                slot.time.every(time => isSessionInPast(time.datetime)) &&
                                                <p className="bp-no-slots">No future slots available</p>}
                                        </div>
                                    </div>
                                );
                            }).filter(Boolean)}  {/* Filter out null days */}

                            {selectedTrainer.availability.filter(slot =>
                                slot.time && slot.time.length > 0 &&
                                slot.time.some(time => isSessionAvailable(selectedTrainer._id, time.datetime))
                            ).length === 0 && (
                                <div className="bp-no-availability">
                                    <p>This trainer has no available future time slots.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="bp-no-availability">This trainer has not set their availability.</p>
                    )}
                </div>
            )}

            {/* Step 3: Confirm Payment */}
            {bookingStep === 3 && selectedSession && (
                <div className="bp-payment-confirmation">
                    <h2>Confirm Your Booking</h2>
                    <button className="bp-back-button" onClick={() => setBookingStep(2)}>
                        ← Back to Schedule
                    </button>

                    <div className="bp-booking-summary">
                        <h3>Booking Details:</h3>
                        <p><strong>Trainer:</strong> {trainers.find(t => t._id === selectedSession.trainerId)?.username}</p>
                        <p><strong>Date:</strong> {formatDate(selectedSession.time)}</p>
                        <p><strong>Time:</strong> {formatTime(selectedSession.time)}</p>
                        <p><strong>Session Fee:</strong> <span className="bp-price-highlight">${selectedSession.price || getSessionCost()}</span></p>
                        
                        {/* Show balance notification for in-person payments */}
                        {outstandingPayment > 0 && (
                            <div className="bp-outstanding-notice">
                                <p><strong>Note:</strong> You have an outstanding balance of ${outstandingPayment.toFixed(2)}. 
                                This new session will be added to your account.</p>
                            </div>
                        )}
                    </div>

                    {!showStripeForm ? (
                        <div className="bp-payment-methods">
                            <h3>Select Payment Method:</h3>
                            <div className="bp-payment-options">
                                {hasActiveSubscription && subscriptionDetails && subscriptionDetails.sessionsRemaining > 0 && (
                                    <label className="bp-payment-option">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="subscription"
                                            checked={paymentMethod === "subscription"}
                                            onChange={() => setPaymentMethod("subscription")}
                                        />
                                        <span className="bp-payment-label">
                                            Use Subscription 
                                            <span className="bp-sessions-left">
                                                ({subscriptionDetails.sessionsRemaining} sessions left)
                                            </span>
                                        </span>
                                    </label>
                                )}

                                <label className="bp-payment-option">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="creditCard"
                                        checked={paymentMethod === "creditCard"}
                                        onChange={() => setPaymentMethod("creditCard")}
                                    />
                                    <span className="bp-payment-label">Credit Card</span>
                                </label>

                                <label className="bp-payment-option">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="inPerson"
                                        checked={paymentMethod === "inPerson"}
                                        onChange={() => setPaymentMethod("inPerson")}
                                    />
                                    <span className="bp-payment-label">Pay at Gym (Cash)</span>
                                </label>
                            </div>

                            <div className="bp-payment-details">
                                {paymentMethod === "subscription" && (
                                    <div className="bp-subscription-payment-info">
                                        <p>You'll use 1 session from your subscription.</p>
                                        <p>After this booking, you'll have {subscriptionDetails?.sessionsRemaining - 1} sessions remaining.</p>
                                    </div>
                                )}
                                
                                {paymentMethod === "inPerson" && (
                                    <div className="bp-inperson-payment-info">
                                        <p>Your session fee of ${selectedSession.price || getSessionCost()} will be added to your account.</p>
                                        <p>Please pay at the gym during your session.</p>
                                        <p>New total balance due: ${(parseFloat(outstandingPayment) + parseFloat(selectedSession.price || getSessionCost())).toFixed(2)}</p>
                                    </div>
                                )}
                            </div>

                            <button
                                className="bp-confirm-button"
                                onClick={handleBookSession}
                                disabled={!paymentMethod}
                            >
                                {paymentMethod === "subscription" ? "Book with Subscription" :
                                    paymentMethod === "inPerson" ? "Book Now (Pay Later)" :
                                        "Proceed to Payment"}
                            </button>
                        </div>
                    ) : (
                        <div className="bp-stripe-payment">
                            <h3>Enter Card Details</h3>
                            <Elements stripe={stripePromise}>
                                <PaymentForm
                                    amount={selectedSession.price || getSessionCost()}
                                    bookingId={currentBookingId}
                                    onSuccess={handlePaymentSuccess}
                                    onError={handlePaymentError}
                                />
                            </Elements>
                            <button
                                className="bp-back-button bp-payment-back"
                                onClick={toggleStripeForm}
                            >
                                Back to Payment Options
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Payment Success Message */}
            {paymentSuccess && (
                <div className="bp-payment-success">
                    <div className="bp-success-icon">✓</div>
                    <h2>Payment Successful!</h2>
                    <p>Your session has been booked.</p>
                    <button className="bp-success-button" onClick={resetBookingProcess}>
                        Book Another Session
                    </button>
                </div>
            )}

            {/* Bookings List */}
            <div className="bp-bookings-list">
                <h2 className="bp-bookings-title">Your Bookings</h2>
                {bookings.length > 0 ? (
                    <ul className="bp-bookings-items">
                        {bookings.map((booking) => {
                            const sessionDate = new Date(booking.sessionTime);
                            const isUpcoming = sessionDate > new Date();
                            const isPaid = booking.paymentStatus === "paid" || booking.paymentMethod === "subscription" || booking.paymentMethod === "creditCard";

                            return (
                                <li
                                    key={booking._id}
                                    className={`
                                        bp-booking-item 
                                        ${!isPaid && isUpcoming ? 'bp-booking-unpaid' : ''}
                                        ${!isUpcoming ? 'bp-booking-past' : ''}
                                    `}
                                >
                                    <div className="bp-booking-trainer">
                                        <strong>{booking.trainerId?.username || "Trainer (Deleted)"}</strong>
                                    </div>
                                    <div className="bp-booking-datetime">
                                        {formatDate(sessionDate)} at {formatTime(sessionDate)}
                                    </div>
                                    <div className="bp-booking-price">
                                        ${booking.sessionPrice || "10.00"}
                                    </div>
                                    <div className="bp-booking-status">
                                        {isUpcoming ? "Upcoming" : "Completed"}
                                    </div>
                                    <div className={`bp-booking-payment ${isPaid ? 'bp-payment-paid' : 'bp-payment-unpaid'}`}>
                                        {booking.paymentMethod === "subscription" ? (
                                            <span className="bp-payment-subscription">✔ Covered by Subscription</span>
                                        ) : booking.paymentMethod === "creditCard" ? (
                                            <span className="bp-payment-paid">✔ Paid by Card</span>
                                        ) : isPaid ? (
                                            "Paid"
                                        ) : isUpcoming ? (
                                            <div className="bp-payment-actions">
                                                <span className="bp-payment-warning">Payment Due</span>
                                                <button
                                                    onClick={() => {
                                                        // Set up the payment process
                                                        setSelectedSession({
                                                            trainerId: booking.trainerId?._id || booking.trainerId,
                                                            time: new Date(booking.sessionTime),
                                                            price: booking.sessionPrice || 10
                                                        });
                                                        setPaymentMethod("creditCard");
                                                        setShowStripeForm(true);
                                                        setBookingStep(3);

                                                        // Store the currently selected booking ID
                                                        setCurrentBookingId(booking._id);
                                                    }}
                                                >
                                                    Pay Now
                                                </button>
                                            </div>
                                        ) : (
                                            "Unpaid"
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="bp-no-bookings">You don't have any bookings yet.</p>
                )}
            </div>
        </div>
    );
};

export default BookingsPage;