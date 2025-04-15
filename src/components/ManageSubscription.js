import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ManageSubscription.css";

const ManageSubscription = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(""); // Reset error on new fetch
    try {
      const response = await axios.get("/api/subscriptions", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSubscriptions(response.data);
    } catch (error) {
      setError("Error fetching subscriptions.");
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (id) => {
    setLoading(true);
    setError(""); // Reset error on new action
    try {
      const response = await axios.put(`/api/subscriptions/cancel/${id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // Update the renewal date to the current date
      const updatedSubscription = response.data.subscription;
      updatedSubscription.renewalDate = new Date();  // Set current date as renewal date
      setSubscriptions(subscriptions.map(sub => sub._id === id ? updatedSubscription : sub));

      fetchSubscriptions(); // Refresh list after canceling
    } catch (error) {
      setError("Error canceling subscription.");
      console.error("Error canceling subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const renewSubscription = async (id) => {
    setLoading(true);
    setError(""); // Reset error on new action
    try {
      const response = await axios.put(`/api/subscriptions/renew/${id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // Update the renewal date to the new end date
      const updatedSubscription = response.data.subscription;
      updatedSubscription.renewalDate = updatedSubscription.endDate;  // Set new renewal date
      setSubscriptions(subscriptions.map(sub => sub._id === id ? updatedSubscription : sub));

      fetchSubscriptions(); // Refresh list after renewing
    } catch (error) {
      setError("Error renewing subscription.");
      console.error("Error renewing subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscription-container">
      <h1 className="subscription-title">Subscription Management</h1>

      {loading && <div>Loading...</div>}
      {error && <div className="error-message">{error}</div>}

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
                  <button
                    onClick={() => cancelSubscription(sub._id)}
                    className="cancel-btn"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => renewSubscription(sub._id)}
                    className="renew-btn"
                    disabled={loading}
                  >
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

export default ManageSubscription;
