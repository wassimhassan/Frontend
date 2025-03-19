import React, { useEffect, useState } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import "./PaymentsPage.css"; // Ensure this CSS file exists

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || "");

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  // ✅ Fetch client's payment history
  const fetchPaymentHistory = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/payment/payments/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPayments(response.data);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError("Failed to load payment history.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payments-container">
      <h1 className="payments-title">Your Payment History</h1>

      {loading ? (
        <p>Loading payments...</p>
      ) : error ? (
        <p className="payments-error">{error}</p>
      ) : payments.length === 0 ? (
        <p>No payment history available.</p>
      ) : (
        <table className="payments-table">
          <thead>
            <tr>
              <th>Amount</th>
              <th>Method</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment._id}>
                <td>${payment.amount.toFixed(2)}</td>
                <td>{payment.method}</td>
                <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                <td>{payment.status || "Completed"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Elements stripe={stripePromise}>
        <PaymentForm fetchPaymentHistory={fetchPaymentHistory} />
      </Elements>
    </div>
  );
};

const PaymentForm = ({ fetchPaymentHistory }) => {
  const stripe = useStripe();
  const elements = useElements();
  const token = localStorage.getItem("token");
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!stripe || !elements) {
      setError("Stripe is not loaded correctly.");
      setLoading(false);
      return;
    }

    try {
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement),
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/payment/stripe`,
        { amount, paymentMethodId: paymentMethod.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Payment successful!");
      fetchPaymentHistory(); // Refresh the payment history
      elements.getElement(CardElement).clear();
    } catch (error) {
      console.error("Error processing payment:", error);
      setError("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form-container">
      <h2>Make a Payment</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <CardElement className="card-element" />
        <button type="submit" disabled={!stripe || loading}>
          {loading ? "Processing..." : "Pay Now"}
        </button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </form>
    </div>
  );
};

export default PaymentsPage;
