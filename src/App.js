import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import FirstPage from './components/FirstPage';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Chat from './components/Chat';
import Availability from './components/TrainerAvailability';
import TrainerLogin from './components/TrainerLogin';
import Navbar from './components/Navbar';
import ProfileCard from "./components/ProfileCard";
import PTCard from './components/PtCard';
import ResetPassword from "./components/ResetPassword";
import WelcomePage from './components/WelcomePage';
import WorkoutPlan from './components/WorkoutPlan';
import AssignWorkout from './components/AssignWorkout';
import TrainerDashboard from './components/TrainerDashboard';
import ClientDashboard from './components/ClientDashboard';
import BookingsPage from './components/BookingsPage';
import ViewBookings from './components/ViewBookings';  // View booked sessions
import ViewAvailability from './components/ViewAvailability'; // Trainer availability list

function App() {
  const [trainerId, setTrainerId] = useState(localStorage.getItem("trainerId") || null);
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const updateUserRole = () => {
      const storedRole = localStorage.getItem("role");
      const storedToken = localStorage.getItem("token");
  
      if (!storedToken) {
        setUserRole(null);
      } else {
        setUserRole(storedRole);
      }
    };
  
    updateUserRole(); // Run immediately
  
    window.addEventListener("storage", updateUserRole); // Listen for storage changes
  
    return () => {
      window.removeEventListener("storage", updateUserRole);
    };
  }, []);
  

  return (
    <Router>
      <MainContent trainerId={trainerId} setTrainerId={setTrainerId} userRole={userRole} />
    </Router>
  );
}

// 🔹 Redirect to login if not authenticated
const ProtectedRoute = ({ element, userRole }) => {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/login" />;
};

function MainContent({ trainerId, setTrainerId, userRole }) {
  const location = useLocation();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Paths where the Navbar should be hidden
  const hideNavbarPaths = ['/', '/WelcomePage', '/signup', '/login', '/reset-password', '/trainer-login'];

  return (
    <>
      {/* Hide Navbar when on specific paths */}
      {!hideNavbarPaths.includes(location.pathname) && !isSigningUp && !isLoggingIn && <Navbar userRole={userRole} />}

      <Routes>
        <Route path="/" element={<FirstPage />} />
        <Route path="/WelcomePage" element={<WelcomePage />} />
        <Route path="/signup" element={<SignUp setIsSigningUp={setIsSigningUp} />} />
        <Route path="/login" element={<Login setIsLoggingIn={setIsLoggingIn} />} />
        <Route path="/trainer-login" element={<TrainerLogin setTrainerId={setTrainerId} />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Profile Route based on User Role */}
        {userRole === "client" && <Route path="/profile" element={<ProtectedRoute element={<ProfileCard />} userRole={userRole} />} />}
        {userRole === "trainer" && <Route path="/profile" element={<ProtectedRoute element={<PTCard />} userRole={userRole} />} />}

        {/* CLIENT Routes */}
        {userRole === "client" && (
          <>
            <Route path="/chat" element={<ProtectedRoute element={<Chat />} userRole={userRole} />} />
            <Route path="/booking" element={<ProtectedRoute element={<BookingsPage />} userRole={userRole} />} />
            <Route path="/view-bookings" element={<ProtectedRoute element={<ViewBookings />} userRole={userRole} />} />
            <Route path="/client-dashboard" element={<ProtectedRoute element={<ClientDashboard />} userRole={userRole} />} />
          </>
        )}

        {/* TRAINER Routes */}
        {userRole === "trainer" && (
          <>
            <Route path="/chat" element={<ProtectedRoute element={<Chat />} userRole={userRole} />} />
            <Route path="/availability" element={<ProtectedRoute element={<Availability trainerId={trainerId} />} userRole={userRole} />} />
            <Route path="/view-availability" element={<ProtectedRoute element={<ViewAvailability />} userRole={userRole} />} />
            <Route path="/trainer-dashboard" element={<ProtectedRoute element={<TrainerDashboard />} userRole={userRole} />} />
            <Route path="/workout-plan" element={<ProtectedRoute element={<WorkoutPlan />} userRole={userRole} />} />
            <Route path="/assign-workout" element={<ProtectedRoute element={<AssignWorkout />} userRole={userRole} />} />
          </>
        )}

        {/* Redirect all unknown routes to login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
