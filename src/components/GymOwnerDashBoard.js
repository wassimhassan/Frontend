import React, { useEffect, useState } from "react";
import axios from "axios";
import "./GymOwnerDashboard.css";

const GymOwnerDashboard = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchSubscriptions();
    fetchPayments();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get("/api/subscriptions", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSubscriptions(response.data);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axios.get("/api/payments", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setPayments(response.data);
      calculateTotalRevenue(response.data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const calculateTotalRevenue = (payments) => {
    const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
    setTotalRevenue(total);
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Gym Owner Dashboard</h1>
      
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

      <h2>Subscription Renewals</h2>
      <table className="dashboard-table">
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
            <tr key={sub._id}>
              <td>{sub.clientId.username}</td>
              <td>{sub.planType}</td>
              <td>{new Date(sub.renewalDate).toLocaleDateString()}</td>
              <td className={sub.status === "active" ? "status-active" : "status-expired"}>{sub.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Revenue Overview</h2>
      <table className="dashboard-table">
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
            <tr key={payment._id}>
              <td>{payment.clientId.username}</td>
              <td>${payment.amount.toFixed(2)}</td>
              <td>{payment.method}</td>
              <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GymOwnerDashboard;
