import React, { useEffect, useState } from "react";
import axios from "axios";
import "./GymOwnerDashboard.css";
import { useNavigate } from "react-router-dom";

const GymOwnerDashboard = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Store token once to avoid repeated localStorage calls
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use Promise.all for concurrent API calls
        const [subsRes, payRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/track`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/payment`, { 
            headers: { Authorization: `Bearer ${token}` } 
          })
        ]);

        // Sort subscriptions by renewal date
        const sortedSubscriptions = subsRes.data.sort((a, b) => 
          new Date(a.renewalDate) - new Date(b.renewalDate)
        );

        setSubscriptions(sortedSubscriptions);
        setPayments(payRes.data);
        calculateTotalRevenue(payRes.data);
      } catch (error) {
        console.error("Error loading dashboard:", error);
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("gymOwnerId");
          navigate("/gym-owner/login");
        } else {
          setError("Failed to load dashboard data. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  const calculateTotalRevenue = (payments) => {
    const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
    setTotalRevenue(total);
  };

  // Render methods for empty states
  const renderEmptyState = (entityName) => (
    <div className="empty-state">
      <p>No {entityName} found.</p>
    </div>
  );

  // Helper method to determine status class
  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return 'status active';
      case 'expired': return 'status expired';
      case 'pending': return 'status pending';
      default: return 'status';
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="gym-owner-dashboard">
      <h1>Gym Owner Dashboard</h1>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p>${totalRevenue.toFixed(2)}</p>
        </div>

        <div className="stat-card">
          <h3>Active Subscriptions</h3>
          <p>{subscriptions.filter(sub => sub.status === "active").length}</p>
        </div>

        <div className="stat-card">
          <h3>Pending Renewals</h3>
          <p>{subscriptions.filter(sub => new Date(sub.renewalDate) < new Date()).length}</p>
        </div>
      </div>

      <div className="subscriptions-section">
        <h2>Subscription Renewals</h2>
        {subscriptions.length === 0 ? (
          renderEmptyState("subscriptions")
        ) : (
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Plan</th>
                <th>Renewal Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={`sub-${sub._id}`}>
                  <td>{sub.clientId?.username || 'N/A'}</td>
                  <td>{sub.planType}</td>
                  <td>{new Date(sub.renewalDate).toLocaleDateString()}</td>
                  <td>
                    <span className={getStatusClass(sub.status)}>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="payments-section">
        <h2>Revenue Overview</h2>
        {payments.length === 0 ? (
          renderEmptyState("payments")
        ) : (
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={`pay-${payment._id}`}>
                  <td>{payment.clientId?.username || 'N/A'}</td>
                  <td>${payment.amount.toFixed(2)}</td>
                  <td>{payment.method}</td>
                  <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GymOwnerDashboard;