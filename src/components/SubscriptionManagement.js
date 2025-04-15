import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SubscriptionManagement.css";

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/all-subscriptions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubscriptions(response.data.subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      setError("Failed to load subscriptions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cancel Subscription
  const cancelSubscription = async (id) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/cancel/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.message) {
        setError(null);
        fetchSubscriptions(); // Refresh the list
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      setError("Failed to cancel subscription. Please try again.");
    }
  };

  // ✅ Renew Subscription
  const renewSubscription = async (id) => {
    try {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        const response = await axios.put(
            `${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/renew/${id}`,
            {
                endDate: endDate.toISOString(),
                amountPaid: 0, // This will be updated when payment is processed
                method: "cash", // Default to cash payment
                transactionId: "N/A" // For cash payments
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.message) {
            setError(null);
            fetchSubscriptions(); // Refresh the list
        }
    } catch (error) {
        console.error("Error renewing subscription:", error);
        setError("Failed to renew subscription. Please try again.");
    }
};

  // ✅ Approve Pending Subscription
  const approveSubscription = async (id) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/approve/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.message) {
        setError(null);
        fetchSubscriptions(); // Refresh the list
      }
    } catch (error) {
      console.error("Error approving subscription:", error);
      setError("Failed to approve subscription. Please try again.");
    }
  };

  if (loading) {
    return <div className="loading">Loading subscriptions...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="subscription-container">
      <h1 className="subscription-title">Manage Client Subscriptions</h1>

      {subscriptions.length === 0 ? (
        <div className="empty-state">No subscriptions found.</div>
      ) : (
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
              <tr key={`sub-${sub._id}`}>
                <td>{sub.clientId?.username || 'N/A'}</td>
                <td>{sub.planType}</td>
                <td>{new Date(sub.renewalDate).toLocaleDateString()}</td>
                <td className={sub.status === "active" ? "status-active" : sub.status === "pending" ? "status-pending" : "status-canceled"}>
                  {sub.status}
                </td>
                <td>
                  {sub.status === "active" ? (
                    <button onClick={() => cancelSubscription(sub._id)} className="cancel-btn">
                      Cancel
                    </button>
                  ) : sub.status === "pending" ? (
                    <button onClick={() => approveSubscription(sub._id)} className="approve-btn">
                      Approve
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
      )}
    </div>
  );
};

export default SubscriptionManagement;
