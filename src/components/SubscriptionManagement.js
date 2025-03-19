import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SubscriptionManagement.css";

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");
  const navigate = useNavigate();

  // ✅ Redirect unauthorized users
  useEffect(() => {
    if (!token || userRole !== "gymOwner") {
      navigate("/login");
    } else {
      fetchSubscriptions();
    }
  }, [token, userRole, navigate]);

  // ✅ Fetch all subscriptions
  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/subscriptions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubscriptions(response.data);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    }
  };

  // ✅ Cancel Subscription
  const cancelSubscription = async (id) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/cancel/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchSubscriptions();
    } catch (error) {
      console.error("Error canceling subscription:", error);
    }
  };

  // ✅ Renew Subscription
  const renewSubscription = async (id) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/renew/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchSubscriptions();
    } catch (error) {
      console.error("Error renewing subscription:", error);
    }
  };

  return (
    <div className="subscription-container">
      <h1 className="subscription-title">Manage Client Subscriptions</h1>

      <table className="subscription-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Plan</th>
            <th>Renewal Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <tr key={sub._id}>
              <td>{sub.clientId.username}</td>
              <td>{sub.planType}</td>
              <td>{new Date(sub.renewalDate).toLocaleDateString()}</td>
              <td className={sub.status === "active" ? "status-active" : "status-expired"}>
                {sub.status}
              </td>
              <td>
                {sub.status === "active" ? (
                  <button onClick={() => cancelSubscription(sub._id)} className="cancel-btn">
                    Cancel
                  </button>
                ) : (
                  <button onClick={() => renewSubscription(sub._id)} className="renew-btn">
                    Renew
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubscriptionManagement;
