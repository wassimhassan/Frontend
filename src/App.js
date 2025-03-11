import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import FirstPage from './components/FirstPage';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Chat from './components/Chat';
import Availability from './components/TrainerAvailability';
import TrainerLogin from './components/TrainerLogin';
import GymOwnerDashboard from './components/GymOwnerDashboard';
import GymOwnerLogin from './components/GymOwnerLogin';
import SubscriptionManagement from './components/SubscriptionMnagement';
import PaymentManagement from './components/PaymentManagement';
import ClientManagement from './components/ClientManagement';
import ProfileCard from "./components/ProfileCard";
import PTCard from './components/PtCard';
import ResetPassword from "./components/ResetPassword";
import WelcomePage from './components/WelcomePage';
import BookingsPage from './components/BookingsPage';
import ViewBookings from './components/ViewBookings';
import ViewAvailability from './components/ViewAvailability';

function App() {
  const [trainerId, setTrainerId] = useState(localStorage.getItem("trainerId") || null);
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setUserRole(null);
    } else {
      setUserRole(localStorage.getItem("role"));
    }
  }, [token]);

  return (
    <Router>
      <MainContent
        trainerId={trainerId}
        setTrainerId={setTrainerId}
        userRole={userRole}
        setUserRole={setUserRole}
      />
    </Router>
  );
}

// 🔹 Protected Route Logic
const ProtectedRoute = ({ element, userRole, allowedRoles }) => {
  const token = localStorage.getItem("token");

  return token && allowedRoles.includes(userRole) ? element : <Navigate to="/" />;
};

function MainContent({ trainerId, setTrainerId, userRole, setUserRole }) {
  const location = useLocation();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Paths where the Navbar should be hidden
  const hideNavbarPaths = ['/', '/WelcomePage', '/signup', '/login', '/reset-password', '/trainer-login', '/gym-owner-login'];

  return (
    <>
      {/* Hide Navbar when on specific paths */}
      {!hideNavbarPaths.includes(location.pathname) && !isSigningUp && !isLoggingIn && (
        <nav className="navbar">
          <div className="navbar-logo">
            <h2>Gym Manager</h2>
          </div>
          <ul className="navbar-links">
            <li><Link to="/gym-dashboard">Dashboard</Link></li>
            {userRole === "gymOwner" && (
              <>
                <li><Link to="/clients">Clients</Link></li>
                <li><Link to="/payments">Payments</Link></li>
                <li><Link to="/subscriptions">Subscriptions</Link></li>
              </>
            )}
          </ul>
          <div className="navbar-profile">
            <span className="owner-name">{localStorage.getItem('ownerName') || 'Gym Owner'}</span>
            <button className="logout-btn" onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                localStorage.clear();
                setUserRole(null);
                window.location.href = "/";
              }
            }}>
              Logout
            </button>
          </div>
        </nav>
      )}

      <Routes>
        <Route path="/" element={<FirstPage />} />
        <Route path="/WelcomePage" element={<WelcomePage />} />
        <Route path="/signup" element={<SignUp setIsSigningUp={setIsSigningUp} />} />
        <Route path="/login" element={<Login setIsLoggingIn={setIsLoggingIn} />} />
        <Route path="/trainer-login" element={<TrainerLogin setTrainerId={setTrainerId} />} />
        <Route path="/gym-owner-login" element={<GymOwnerLogin setUserRole={setUserRole} />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* PROFILE Routes based on User Role */}
        {userRole === "client" && (
          <Route path="/profile" element={<ProtectedRoute element={<ProfileCard />} userRole={userRole} allowedRoles={["client"]} />} />
        )}
        {userRole === "trainer" && (
          <Route path="/profile" element={<ProtectedRoute element={<PTCard />} userRole={userRole} allowedRoles={["trainer"]} />} />
        )}

        {/* CLIENT Routes */}
        {userRole === "client" && (
          <>
            <Route path="/chat" element={<ProtectedRoute element={<Chat />} userRole={userRole} allowedRoles={["client"]} />} />
            <Route path="/booking" element={<ProtectedRoute element={<BookingsPage />} userRole={userRole} allowedRoles={["client"]} />} />
            <Route path="/view-bookings" element={<ProtectedRoute element={<ViewBookings />} userRole={userRole} allowedRoles={["client"]} />} />
          </>
        )}

        {/* TRAINER Routes */}
        {userRole === "trainer" && (
          <>
            <Route path="/chat" element={<ProtectedRoute element={<Chat />} userRole={userRole} allowedRoles={["trainer"]} />} />
            <Route path="/availability" element={<ProtectedRoute element={<Availability trainerId={trainerId} />} userRole={userRole} allowedRoles={["trainer"]} />} />
            <Route path="/view-availability" element={<ProtectedRoute element={<ViewAvailability />} userRole={userRole} allowedRoles={["trainer"]} />} />
          </>
        )}

        {/* GYM OWNER Routes */}
        {userRole === "gymOwner" && (
          <>
            <Route path="/gym-dashboard" element={<ProtectedRoute element={<GymOwnerDashboard />} userRole={userRole} allowedRoles={["gymOwner"]} />} />
            <Route path="/clients" element={<ProtectedRoute element={<ClientManagement />} userRole={userRole} allowedRoles={["gymOwner"]} />} />
            <Route path="/payments" element={<ProtectedRoute element={<PaymentManagement />} userRole={userRole} allowedRoles={["gymOwner"]} />} />
            <Route path="/subscriptions" element={<ProtectedRoute element={<SubscriptionManagement />} userRole={userRole} allowedRoles={["gymOwner"]} />} />
          </>
        )}

        {/* Redirect all unknown routes to login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
