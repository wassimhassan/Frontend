import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ManageSubscription.css";

const ManageSubscription = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'active', 'canceled', 'pending'
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'cancel'|'renew', id: 'subscriptionId' }
  const [sortConfig, setSortConfig] = useState({ key: 'renewalDate', direction: 'asc' });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(""); // Reset error on new fetch
    setSuccess("");
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/subscriptions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSubscriptions(response.data);
    } catch (error) {
      setError("Error fetching subscriptions. Please try again.");
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (id) => {
    setLoading(true);
    setError(""); // Reset error on new action
    setSuccess("");
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/cancel/${id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setSuccess("Subscription cancelled successfully");
      fetchSubscriptions(); // Refresh list after canceling
    } catch (error) {
      setError("Error canceling subscription. Please try again.");
      console.error("Error canceling subscription:", error);
    } finally {
      setLoading(false);
      setConfirmAction(null); // Close confirmation dialog
    }
  };

  const renewSubscription = async (id) => {
    setLoading(true);
    setError(""); // Reset error on new action
    setSuccess("");
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/renew/${id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setSuccess("Subscription renewed successfully");
      fetchSubscriptions(); // Refresh list after renewing
    } catch (error) {
      setError("Error renewing subscription. Please try again.");
      console.error("Error renewing subscription:", error);
    } finally {
      setLoading(false);
      setConfirmAction(null); // Close confirmation dialog
    }
  };

  // Handles the sorting of subscriptions
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort subscriptions based on sort config
  const sortedSubscriptions = React.useMemo(() => {
    let sortableItems = [...subscriptions];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        // Special handling for dates
        if (sortConfig.key === 'renewalDate' || sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
          const dateA = new Date(a[sortConfig.key]);
          const dateB = new Date(b[sortConfig.key]);
          if (sortConfig.direction === 'asc') {
            return dateA - dateB;
          }
          return dateB - dateA;
        }
        
        // Special handling for client username
        if (sortConfig.key === 'clientName') {
          const nameA = a.clientId?.username || '';
          const nameB = b.clientId?.username || '';
          if (sortConfig.direction === 'asc') {
            return nameA.localeCompare(nameB);
          }
          return nameB.localeCompare(nameA);
        }
        
        // General handling for other fields
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [subscriptions, sortConfig]);

  // Filter subscriptions based on selected filter
  const filteredSubscriptions = React.useMemo(() => {
    if (filter === 'all') {
      return sortedSubscriptions;
    }
    return sortedSubscriptions.filter(sub => sub.status === filter);
  }, [sortedSubscriptions, filter]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days remaining until renewal
  const getDaysRemaining = (renewalDate) => {
    const today = new Date();
    const renewal = new Date(renewalDate);
    const diffTime = renewal - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get appropriate status badge class
  const getStatusBadgeClass = (status, renewalDate) => {
    if (status === 'active') {
      const daysRemaining = getDaysRemaining(renewalDate);
      if (daysRemaining < 0) {
        return 'status-overdue';
      }
      if (daysRemaining < 7) {
        return 'status-warning';
      }
      return 'status-active';
    }
    if (status === 'pending') {
      return 'status-pending';
    }
    return 'status-canceled';
  };

  // Get class for the sort icon
  const getSortIconClass = (key) => {
    if (sortConfig.key !== key) {
      return 'sort-icon';
    }
    return sortConfig.direction === 'asc' ? 'sort-icon ascending' : 'sort-icon descending';
  };

  return (
    <div className="subscription-container">
      <h1 className="subscription-title">Subscription Management</h1>
      
      {/* Success and Error messages */}
      {success && (
        <div className="success-message">
          <span className="message-icon">✓</span>
          <span className="message-text">{success}</span>
          <button className="message-close" onClick={() => setSuccess("")}>×</button>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <span className="message-icon">!</span>
          <span className="message-text">{error}</span>
          <button className="message-close" onClick={() => setError("")}>×</button>
        </div>
      )}
      
      {/* Action confirmation dialog */}
      {confirmAction && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>
              {confirmAction.type === 'cancel' 
                ? 'Cancel Subscription?' 
                : 'Renew Subscription?'}
            </h3>
            <p>
              {confirmAction.type === 'cancel'
                ? 'Are you sure you want to cancel this subscription? This action cannot be undone.'
                : 'Are you sure you want to renew this subscription for another month?'}
            </p>
            <div className="confirmation-buttons">
              <button 
                className="confirm-btn"
                onClick={() => {
                  if (confirmAction.type === 'cancel') {
                    cancelSubscription(confirmAction.id);
                  } else {
                    renewSubscription(confirmAction.id);
                  }
                }}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
              <button 
                className="cancel-confirm-btn"
                onClick={() => setConfirmAction(null)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top toolbar with filters and refresh */}
      <div className="subscription-toolbar">
        <div className="filter-controls">
          <label>Status:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Subscriptions</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
        
        <button 
          className="refresh-btn"
          onClick={fetchSubscriptions}
          disabled={loading}
        >
          <span className="refresh-icon">↻</span> Refresh
        </button>
      </div>

      {/* Subscription count */}
      <div className="subscription-count">
        {filteredSubscriptions.length} subscription{filteredSubscriptions.length !== 1 ? 's' : ''} found
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      {/* Subscriptions table */}
      {filteredSubscriptions.length > 0 ? (
        <div className="table-container">
          <table className="subscription-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('clientName')}>
                  Client
                  <span className={getSortIconClass('clientName')}>⇅</span>
                </th>
                <th onClick={() => requestSort('planType')}>
                  Plan
                  <span className={getSortIconClass('planType')}>⇅</span>
                </th>
                <th onClick={() => requestSort('renewalDate')}>
                  Renewal Date
                  <span className={getSortIconClass('renewalDate')}>⇅</span>
                </th>
                <th onClick={() => requestSort('status')}>
                  Status
                  <span className={getSortIconClass('status')}>⇅</span>
                </th>
                <th>Sessions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((sub) => {
                const daysRemaining = getDaysRemaining(sub.renewalDate);
                const statusClass = getStatusBadgeClass(sub.status, sub.renewalDate);
                
                return (
                  <tr key={sub._id} className={`subscription-row ${statusClass}-row`}>
                    <td className="client-cell">
                      <div className="client-name">{sub.clientId?.username || 'Unknown'}</div>
                      {sub.clientId?.email && <div className="client-email">{sub.clientId.email}</div>}
                    </td>
                    <td className="plan-cell">
                      <span className="plan-badge">{sub.planType}</span>
                    </td>
                    <td className="date-cell">
                      <div className="date-value">{formatDate(sub.renewalDate)}</div>
                      {sub.status === 'active' && (
                        <div className={`days-remaining ${daysRemaining < 0 ? 'overdue' : daysRemaining < 7 ? 'warning' : ''}`}>
                          {daysRemaining < 0 
                            ? `Overdue by ${Math.abs(daysRemaining)} days` 
                            : `${daysRemaining} days remaining`}
                        </div>
                      )}
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${statusClass}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="sessions-cell">
                      {sub.status === 'active' && sub.sessionsRemaining !== undefined ? (
                        <span className="sessions-counter">
                          {sub.sessionsRemaining} / {sub.maxBookingsPerMonth || '∞'}
                        </span>
                      ) : (
                        <span className="sessions-na">N/A</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      {sub.status === "active" ? (
                        <button
                          onClick={() => setConfirmAction({ type: 'cancel', id: sub._id })}
                          className="cancel-btn"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      ) : sub.status === "canceled" ? (
                        <button
                          onClick={() => setConfirmAction({ type: 'renew', id: sub._id })}
                          className="renew-btn"
                          disabled={loading}
                        >
                          Renew
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmAction({ type: 'approve', id: sub._id })}
                          className="approve-btn"
                          disabled={loading}
                        >
                          Approve
                        </button>
                      )}
                      <button className="view-btn" onClick={() => window.location.href = `/subscriptions/${sub._id}/details`}>
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-subscriptions">
          <div className="no-data-icon">📅</div>
          <p>No subscriptions found. {filter !== 'all' ? 'Try changing the filter.' : ''}</p>
        </div>
      )}
    </div>
  );
};

export default ManageSubscription;