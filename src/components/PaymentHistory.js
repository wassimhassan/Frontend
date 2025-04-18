import React, { useState, useEffect } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, Elements, useStripe, useElements } from "@stripe/react-stripe-js";
import "./PaymentHistory.css";

// Load Stripe outside of component to avoid recreating it on re-renders
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

// Format amount for display
const formatAmount = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Payment form component for paying outstanding balance
const OutstandingPaymentForm = ({ amount, onSuccess, onError }) => {
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
                // Send as balance payment
                isBalancePayment: true
            };
            
            // Process payment with backend
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/payment/stripe`,
                paymentData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Handle successful payment
            if (response && response.data) {
                onSuccess(response.data);
            } else {
                // Handle empty but successful response
                onSuccess({ success: true });
            }
            setLoading(false);
        } catch (error) {
            console.error("❌ Payment Failed:", error);
            const errorMessage = error.response?.data?.error ||
                error.message ||
                "Payment processing failed";
            setError(errorMessage);
            onError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="payment-form">
            <div className="card-element-container">
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

            {error && <div className="payment-error">{error}</div>}

            <button
                type="submit"
                className="pay-button"
                disabled={!stripe || loading}
            >
                {loading ? "Processing..." : `Pay ${formatAmount(amount)}`}
            </button>
        </form>
    );
};

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPending, setTotalPending] = useState(0);
  const [userRole, setUserRole] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState({ processing: false, error: null });
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentFilters, setPaymentFilters] = useState({
    status: "all",
    dateRange: "all",
    type: "all",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPaymentHistory(),
        fetchPendingBookings()
      ]);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Failed to load data. Please try again later.");
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/payment/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPayments(response.data.payments || []);
      setTotalPending(response.data.totalPending || 0);
      setPaymentAmount(response.data.totalPending || 0); // Set payment amount
      setUserRole(response.data.userRole);
    } catch (err) {
      console.error("Error fetching payment history:", err);
      throw err;
    }
  };

  const fetchPendingBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/booking/bookings?filter=unpaid`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const bookings = Array.isArray(response.data) ? 
        response.data : 
        (response.data.bookings || []);
        
      // Filter to only include unpaid bookings
      const unpaidBookings = bookings.filter(
        booking => booking.paymentStatus !== "paid" && booking.paymentMethod === "inPerson"
      );
      
      setPendingBookings(unpaidBookings);
    } catch (err) {
      console.error("Error fetching pending bookings:", err);
      throw err;
    }
  };

  const handleFilterChange = (filter, value) => {
    setPaymentFilters({
      ...paymentFilters,
      [filter]: value
    });
  };

  const handlePayOutstanding = () => {
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (data) => {
    setPaymentStatus({ processing: false, error: null });
    setPaymentSuccess(true);
    setShowPaymentForm(false);
    
    // Refresh data after successful payment
    setTimeout(() => {
      fetchData();
      setPaymentSuccess(false);
    }, 2000);
  };

  const handlePaymentError = (errorMessage) => {
    setPaymentStatus({ processing: false, error: errorMessage });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Filter payments based on selected filters
  const filteredPayments = payments.filter(payment => {
    // Filter by status
    if (paymentFilters.status !== "all" && payment.status !== paymentFilters.status) {
      return false;
    }
    
    // Filter by date range
    if (paymentFilters.dateRange !== "all") {
      const paymentDate = new Date(payment.date);
      const today = new Date();
      
      if (paymentFilters.dateRange === "thisMonth") {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        if (paymentDate < firstDayOfMonth) return false;
      } else if (paymentFilters.dateRange === "lastMonth") {
        const firstDayOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        if (paymentDate < firstDayOfLastMonth || paymentDate >= firstDayOfThisMonth) return false;
      } else if (paymentFilters.dateRange === "thisYear") {
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        if (paymentDate < firstDayOfYear) return false;
      }
    }

    // Filter by payment type (from description)
    if (paymentFilters.type !== "all") {
      const description = (payment.description || "").toLowerCase();
      
      if (paymentFilters.type === "subscription" && !description.includes("subscription")) {
        return false;
      } else if (paymentFilters.type === "session" && !description.includes("session")) {
        return false;
      } else if (paymentFilters.type === "other" && 
                (description.includes("subscription") || description.includes("session"))) {
        return false;
      }
    }
    
    return true;
  });

  // Calculate totals based on filtered payments
  const totalAmount = filteredPayments.reduce((total, payment) => total + (payment.amount || 0), 0);
  const totalCompletedAmount = filteredPayments
    .filter(payment => payment.status === "completed")
    .reduce((total, payment) => total + (payment.amount || 0), 0);

  if (loading) {
    return <div className="payment-history-loading">Loading payment history...</div>;
  }

  if (error) {
    return <div className="payment-history-error">{error}</div>;
  }

  return (
    <div className="payment-history-container">
      <h2 className="payment-history-title">Payment History</h2>
      
      {/* Payment Success Message */}
      {paymentSuccess && (
        <div className="payment-success-alert">
          <div className="success-icon">✓</div>
          <h3>Payment Successful!</h3>
          <p>Your payment has been processed successfully.</p>
        </div>
      )}
      
      {/* Outstanding Balance Section */}
      {userRole !== 'gymOwner' && totalPending > 0 && (
        <div className="pending-payment-alert">
          <h3>Outstanding Balance</h3>
          <p>You have an outstanding balance of {formatAmount(totalPending)}</p>
          
          {!showPaymentForm ? (
            <button 
              className="pay-now-button"
              onClick={handlePayOutstanding}
            >
              Pay Now
            </button>
          ) : (
            <div className="payment-form-container">
              <h4>Enter Payment Details</h4>
              <Elements stripe={stripePromise}>
                <OutstandingPaymentForm 
                  amount={paymentAmount}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
              <button 
                className="cancel-payment-button"
                onClick={() => setShowPaymentForm(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pending Bookings Section */}
      {pendingBookings.length > 0 && (
        <div className="pending-bookings-section">
          <h3>Unpaid Training Sessions</h3>
          <table className="pending-bookings-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Trainer</th>
                <th>Session Fee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingBookings.map(booking => (
                <tr key={booking._id}>
                  <td>{formatDate(booking.sessionTime)}</td>
                  <td>{booking.trainerId?.username || "Unavailable"}</td>
                  <td>{formatAmount(booking.sessionPrice || 0)}</td>
                  <td>
                    <span className="status-badge pending">
                      Payment Due
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Filters */}
      <div className="payment-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={paymentFilters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Date Range:</label>
          <select 
            value={paymentFilters.dateRange}
            onChange={(e) => handleFilterChange("dateRange", e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">This Year</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Payment Type:</label>
          <select 
            value={paymentFilters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="session">Training Sessions</option>
            <option value="subscription">Subscriptions</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="payment-history-summary">
        <div className="summary-card">
          <h3>Total Transactions</h3>
          <p>{filteredPayments.length}</p>
        </div>
        <div className="summary-card">
          <h3>Total Amount</h3>
          <p>{formatAmount(totalAmount)}</p>
        </div>
        <div className="summary-card">
          <h3>Paid Amount</h3>
          <p>{formatAmount(totalCompletedAmount)}</p>
        </div>
        {userRole !== 'gymOwner' && (
          <div className="summary-card">
            <h3>Outstanding</h3>
            <p>{formatAmount(totalPending)}</p>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="payment-history-list">
        <h3>Transactions</h3>
        {filteredPayments.length === 0 ? (
          <p className="no-payments">No payment history available</p>
        ) : (
          <table className="payment-table">
            <thead>
              <tr>
                <th>Date</th>
                {userRole === 'gymOwner' && <th>Client</th>}
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment._id} className={`payment-row status-${payment.status || 'completed'}`}>
                  <td>{formatDate(payment.date)}</td>
                  {userRole === 'gymOwner' && (
                    <td>
                      {payment.client ? (
                        <span>{payment.client.username}</span>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                  )}
                  <td>{payment.description || 'Payment'}</td>
                  <td>{formatAmount(payment.amount)}</td>
                  <td>
                    <span className={`status-badge ${(payment.status || 'completed').toLowerCase()}`}>
                      {payment.status || 'completed'}
                    </span>
                  </td>
                  <td>
                    {payment.receiptUrl ? (
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="receipt-link"
                      >
                        View Receipt
                      </a>
                    ) : (
                      <span className="no-receipt">No Receipt</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;