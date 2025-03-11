import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './GymOwnerDashboard.css';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const GymOwnerDashboard = () => {
  const [clients, setClients] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    activeClients: 0,
    totalRevenue: 0,
    expiringSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchClients(),
          fetchSubscriptions(),
          fetchPayments()
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    // Calculate stats when data changes
    if (clients.length > 0 && subscriptions.length > 0 && payments.length > 0) {
      calculateStats();
    }
  }, [clients, subscriptions, payments]);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/gym-owner/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscriptions(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      return [];
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/payment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching payments:", error);
      return [];
    }
  };

  const calculateStats = () => {
    const today = new Date();
    
    // Active clients (those with active subscriptions)
    const activeClientIds = subscriptions
      .filter(sub => new Date(sub.endDate) >= today)
      .map(sub => sub.clientId);
    
    const uniqueActiveClients = [...new Set(activeClientIds)];
    
    // Total revenue (sum of all payments)
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Subscriptions expiring in the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    const expiringSubscriptions = subscriptions.filter(sub => {
      const endDate = new Date(sub.endDate);
      return endDate >= today && endDate <= sevenDaysFromNow;
    }).length;
    
    setStats({
      activeClients: uniqueActiveClients.length,
      totalRevenue: totalRevenue.toFixed(2),
      expiringSubscriptions
    });
  };

  // Prepare chart data
  const preparePlanTypeData = () => {
    const planTypes = {};
    
    subscriptions.forEach(sub => {
      if (planTypes[sub.planType]) {
        planTypes[sub.planType]++;
      } else {
        planTypes[sub.planType] = 1;
      }
    });
    
    return {
      labels: Object.keys(planTypes),
      datasets: [
        {
          label: 'Membership Types',
          data: Object.values(planTypes),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1,
        }
      ]
    };
  };

  const preparePaymentMethodData = () => {
    const paymentMethods = {};
    
    payments.forEach(payment => {
      if (paymentMethods[payment.method]) {
        paymentMethods[payment.method]++;
      } else {
        paymentMethods[payment.method] = 1;
      }
    });
    
    return {
      labels: Object.keys(paymentMethods),
      datasets: [
        {
          label: 'Payment Methods',
          data: Object.values(paymentMethods),
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 99, 132, 0.6)',
          ],
          borderWidth: 1,
        }
      ]
    };
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-loading">
          <h2>Loading dashboard data...</h2>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-container">
        <h1>Dashboard Overview</h1>
        
        <div className="stats-cards">
          <div className="stat-card">
            <h3>Active Clients</h3>
            <p className="stat-value">{stats.activeClients}</p>
          </div>
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p className="stat-value">${stats.totalRevenue}</p>
          </div>
          <div className="stat-card">
            <h3>Expiring Soon</h3>
            <p className="stat-value">{stats.expiringSubscriptions}</p>
          </div>
        </div>

        <div className="dashboard-charts">
          <div className="chart-container">
            <h2>Membership Types</h2>
            <div className="chart">
              {subscriptions.length > 0 ? (
                <Pie data={preparePlanTypeData()} />
              ) : (
                <p>No subscription data available</p>
              )}
            </div>
          </div>
          
          <div className="chart-container">
            <h2>Payment Methods</h2>
            <div className="chart">
              {payments.length > 0 ? (
                <Bar 
                  data={preparePaymentMethodData()}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Payment Method Distribution'
                      }
                    }
                  }}
                />
              ) : (
                <p>No payment data available</p>
              )}
            </div>
          </div>
        </div>

        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {payments.length > 0 ? (
              payments.slice(0, 5).map((payment) => {
                const client = clients.find(c => c._id === payment.clientId);
                return (
                  <div key={payment._id} className="activity-item">
                    <p>
                      <strong>{client?.username || 'Unknown Client'}</strong> paid ${payment.amount} 
                      via {payment.method} on {new Date(payment.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                );
              })
            ) : (
              <p>No recent payment activity</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GymOwnerDashboard;