import React, { useEffect, useState } from "react";
import axios from "axios";
import "./GymOwnerDashboard.css";
import { useNavigate } from "react-router-dom";

const GymOwnerDashboard = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const [pendingRenewals, setPendingRenewals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [showSubscriptions, setShowSubscriptions] = useState(true);
  const [showPayments, setShowPayments] = useState(true);
  const navigate = useNavigate();

  // Store token once to avoid repeated localStorage calls
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use Promise.all for concurrent API calls - with only existing endpoints
        const [subsRes, payRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/track`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/payment/history`, { 
            headers: { Authorization: `Bearer ${token}` } 
          })
        ]);

        // Process subscriptions
        const processedSubscriptions = subsRes.data || [];
        processedSubscriptions.sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
        setSubscriptions(processedSubscriptions);
        
        // Count active subscriptions and pending renewals
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        setActiveSubscriptions(processedSubscriptions.filter(sub => sub.status === "active").length);
        setPendingRenewals(processedSubscriptions.filter(sub => 
          sub.status === "active" && new Date(sub.renewalDate) < nextWeek
        ).length);

        // Process payments - filter out zero amounts
        const processedPayments = (payRes.data?.payments || []).filter(payment => payment.amount !== 0);
        setPayments(processedPayments);
        
        // Calculate total revenue - only from non-zero payments
        const revenue = processedPayments
          .filter(payment => payment.status === "completed")
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);
        setTotalRevenue(revenue);
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

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  // Filter payments based on selected filters
  const filteredPayments = payments.filter(payment => {
    // Remove payments with amount 0
    if (payment.amount === 0) return false;
    
    // Time filter
    if (timeFilter !== "all") {
      const paymentDate = new Date(payment.date);
      const now = new Date();
      
      if (timeFilter === "today") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (paymentDate < today) return false;
      } else if (timeFilter === "thisWeek") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        if (paymentDate < startOfWeek) return false;
      } else if (timeFilter === "thisMonth") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (paymentDate < startOfMonth) return false;
      }
    }
    
    // Payment type filter
    if (paymentTypeFilter !== "all") {
      const description = (payment.description || "").toLowerCase();
      
      if (paymentTypeFilter === "subscription" && !description.includes("subscription")) {
        return false;
      } else if (paymentTypeFilter === "session" && !description.includes("session")) {
        return false;
      }
    }
    
    return true;
  });

  // Get appropriate status class for styling
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'status-badge active';
      case 'expired': return 'status-badge expired';
      case 'canceled': return 'status-badge canceled';
      case 'pending': return 'status-badge pending';
      case 'completed': return 'status-badge completed';
      case 'failed': return 'status-badge failed';
      default: return 'status-badge';
    }
  };

  // Approve a pending subscription
  const handleApproveSubscription = async (subscriptionId) => {
    try {
      setLoading(true);
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/approve/${subscriptionId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh data after approval
      const subsRes = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/track`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const processedSubscriptions = subsRes.data || [];
      processedSubscriptions.sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
      setSubscriptions(processedSubscriptions);
      
      // Update counts
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      setActiveSubscriptions(processedSubscriptions.filter(sub => sub.status === "active").length);
      setPendingRenewals(processedSubscriptions.filter(sub => 
        sub.status === "active" && new Date(sub.renewalDate) < nextWeek
      ).length);
      
      setLoading(false);
    } catch (error) {
      console.error("Error approving subscription:", error);
      setError("Failed to approve subscription. Please try again.");
      setLoading(false);
    }
  };

  // Renew a subscription
  const handleRenewSubscription = async (subscriptionId) => {
    try {
      setLoading(true);
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/renew/${subscriptionId}`,
        { method: "cash" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh data after renewal
      const subsRes = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/track`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const processedSubscriptions = subsRes.data || [];
      processedSubscriptions.sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
      setSubscriptions(processedSubscriptions);
      
      // Update counts
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      setActiveSubscriptions(processedSubscriptions.filter(sub => sub.status === "active").length);
      setPendingRenewals(processedSubscriptions.filter(sub => 
        sub.status === "active" && new Date(sub.renewalDate) < nextWeek
      ).length);
      
      setLoading(false);
    } catch (error) {
      console.error("Error renewing subscription:", error);
      setError("Failed to renew subscription. Please try again.");
      setLoading(false);
    }
  };

  // Toggle section visibility
  const toggleSection = (section) => {
    switch(section) {
      case 'subscriptions':
        setShowSubscriptions(!showSubscriptions);
        break;
      case 'payments':
        setShowPayments(!showPayments);
        break;
      default:
        break;
    }
  };

  // Render methods for empty states
  const renderEmptyState = (entityName) => (
    <div className="empty-state">
      <div className="empty-icon">📊</div>
      <p>No {entityName} found.</p>
    </div>
  );

  if (loading) {
    return <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading dashboard data...</p>
    </div>;
  }

  if (error) {
    return <div className="error-container">
      <div className="error-icon">⚠️</div>
      <p>{error}</p>
      <button onClick={() => window.location.reload()} className="retry-button">
        Retry
      </button>
    </div>;
  }

  return (
    <div className="gym-owner-dashboard">
      <div className="dashboard-header">
        <h1>Gym Owner Dashboard</h1>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon revenue">💰</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p>{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon subscriptions">🔄</div>
          <div className="stat-content">
            <h3>Active Subscriptions</h3>
            <p>{activeSubscriptions}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon renewals">📅</div>
          <div className="stat-content">
            <h3>Pending Renewals</h3>
            <p>{pendingRenewals}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section-container subscriptions-section">
          <div className="section-header" onClick={() => toggleSection('subscriptions')}>
            <h2>Subscription Management</h2>
            <span className="section-toggle">{showSubscriptions ? '▼' : '►'}</span>
          </div>
          
          {showSubscriptions && (
            subscriptions.length === 0 ? (
              renderEmptyState("subscriptions")
            ) : (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Plan Type</th>
                    <th>Renewal Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={`sub-${sub._id}`} className={
                      new Date(sub.renewalDate) < new Date() ? 'overdue-row' : 
                      new Date(sub.renewalDate) < new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) ? 'warning-row' : ''
                    }>
                      <td>
                        {sub.clientId?.username || 'N/A'}
                        {sub.clientId?.email && <div className="secondary-text">{sub.clientId.email}</div>}
                      </td>
                      <td className="capitalize-text">{sub.planType}</td>
                      <td>{formatDate(sub.renewalDate)}</td>
                      <td>
                        <span className={getStatusClass(sub.status)}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="actions-cell">
                        {sub.status === "pending" && (
                          <button 
                            onClick={() => handleApproveSubscription(sub._id)}
                            className="action-button small"
                          >
                            Approve
                          </button>
                        )}
                        {sub.status === "active" && new Date(sub.renewalDate) < new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000) && (
                          <button 
                            onClick={() => handleRenewSubscription(sub._id)}
                            className="action-button small"
                          >
                            Renew
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        <div className="section-container payments-section">
          <div className="section-header" onClick={() => toggleSection('payments')}>
            <h2>Revenue Overview</h2>
            <span className="section-toggle">{showPayments ? '▼' : '►'}</span>
          </div>
          
          {showPayments && (
            <>
              <div className="filter-controls">
                <div className="filter-group">
                  <label>Time Period:</label>
                  <select 
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="thisWeek">This Week</option>
                    <option value="thisMonth">This Month</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Payment Type:</label>
                  <select 
                    value={paymentTypeFilter}
                    onChange={(e) => setPaymentTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="subscription">Subscriptions</option>
                    <option value="session">Training Sessions</option>
                  </select>
                </div>
              </div>
              
              {filteredPayments.length === 0 ? (
                renderEmptyState("payments")
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Client</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={`pay-${payment._id}`} className={`status-${payment.status || 'completed'}-row`}>
                        <td>{formatDate(payment.date)}</td>
                        <td>
                          {payment.client?.username || 'N/A'}
                          {payment.client?.email && <div className="secondary-text">{payment.client.email}</div>}
                        </td>
                        <td>{payment.description || 'Payment'}</td>
                        <td className="amount-cell">{formatCurrency(payment.amount)}</td>
                        <td>
                          <span className={getStatusClass(payment.status || 'completed')}>
                            {payment.status || 'completed'}
                          </span>
                        </td>
                        <td>
                          {payment.receiptUrl ? (
                            <a 
                              href={payment.receiptUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="view-receipt-link"
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
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="total-label">Total</td>
                      <td className="total-amount">{formatCurrency(
                        filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
                      )}</td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GymOwnerDashboard;