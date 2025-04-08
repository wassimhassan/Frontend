import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PaymentHistory.css";

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPending, setTotalPending] = useState(0);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
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
        setUserRole(response.data.userRole);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching payment history:", err);
        setError(err.response?.data?.message || "Failed to load payment history. Please try again later.");
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return <div className="payment-history-loading">Loading payment history...</div>;
  }

  if (error) {
    return <div className="payment-history-error">{error}</div>;
  }

  return (
    <div className="payment-history-container">
      <h2 className="payment-history-title">Payment History</h2>
      
      {userRole !== 'gymOwner' && totalPending > 0 && (
        <div className="pending-payment-alert">
          <h3>Pending Payment</h3>
          <p>You have a pending payment of {formatAmount(totalPending)}</p>
          <button 
            className="pay-now-button"
            onClick={() => window.location.href = "/subscribe"}
          >
            Pay Now
          </button>
        </div>
      )}

      <div className="payment-history-summary">
        <div className="summary-card">
          <h3>Total Payments</h3>
          <p>{payments.length}</p>
        </div>
        <div className="summary-card">
          <h3>Total Spent</h3>
          <p>
            {formatAmount(
              payments.reduce((total, payment) => total + (payment.amount || 0), 0)
            )}
          </p>
        </div>
        {userRole !== 'gymOwner' && (
          <div className="summary-card">
            <h3>Pending Amount</h3>
            <p>{formatAmount(totalPending)}</p>
          </div>
        )}
      </div>

      <div className="payment-history-list">
        <h3>Recent Transactions</h3>
        {payments.length === 0 ? (
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
              {payments.map((payment) => (
                <tr key={payment._id}>
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
                    {payment.receiptUrl && (
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="receipt-link"
                      >
                        View Receipt
                      </a>
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