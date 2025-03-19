import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import FirstPage from "./components/FirstPage";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import Chat from "./components/Chat";
import Availability from "./components/TrainerAvailability";
import TrainerLogin from "./components/TrainerLogin";
import Navbar from "./components/Navbar";
import ProfileCard from "./components/ProfileCard";
import PTCard from "./components/PtCard";
import ResetPassword from "./components/ResetPassword";
import WelcomePage from "./components/WelcomePage";
import WorkoutPlan from './components/WorkoutPlan';
import AssignWorkout from './components/AssignWorkout';
import TrainerDashboard from './components/TrainerDashboard';
import ClientDashboard from './components/ClientDashboard';
import BookingsPage from "./components/BookingsPage";
import ViewBookings from "./components/ViewBookings";
import ViewAvailability from "./components/ViewAvailability";
import SubscriptionManagement from "./components/SubscriptionManagement";
import GymOwnerDashBoard from "./components/GymOwnerDashBoard";
import ManageSubscription from "./components/ManageSubscription";
import SubscriptionForm from "./components/SubscriptionForm";  // ✅ Client Subscription Page
import PaymentsPage from "./components/PaymentsPage"; // ✅ Client Payment Page
import GymOwnerLogin from "./components/GymOwnerLogin";
import UnpaidClients from "./components/UnpaidClients"; // ✅ Gym Owner Unpaid Clients Page

function App() {
  console.log("App is rendering..."); // Debugging console log

  // Retrieve data from local storage
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

    // Hide Navbar for these paths
    const hideNavbarPaths = ["/", "/WelcomePage", "/signup", "/login", "/reset-password", "/trainer-login"];

    return (
      <>
        {/* ✅ Show Navbar only when needed */}
        {!hideNavbarPaths.includes(location.pathname) && !isSigningUp && !isLoggingIn && <Navbar userRole={userRole} />}

        <Routes>
          {/* 🔹 Public Routes */}
          <Route path="/" element={<FirstPage />} />
          <Route path="/WelcomePage" element={<WelcomePage />} />
          <Route path="/signup" element={<SignUp setIsSigningUp={setIsSigningUp} />} />
          <Route path="/login" element={<Login setIsLoggingIn={setIsLoggingIn} />} />
          <Route path="/trainer-login" element={<TrainerLogin setTrainerId={setTrainerId} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/gym-owner-login" element={<GymOwnerLogin />} />

          {/* 🔹 Client-Only Routes */}
          {userRole === "client" && (
            <>
              <Route path="/profile" element={<ProtectedRoute element={<ProfileCard />} allowedRoles={["client"]} />} />
              <Route path="/chat" element={<ProtectedRoute element={<Chat />} allowedRoles={["client"]} />} />
              <Route path="/booking" element={<ProtectedRoute element={<BookingsPage />} allowedRoles={["client"]} />} />
              <Route path="/view-bookings" element={<ProtectedRoute element={<ViewBookings />} allowedRoles={["client"]} />} />
              <Route path="/payments" element={<ProtectedRoute element={<PaymentsPage />} allowedRoles={["client"]} />} />
              <Route path="/subscribe" element={<ProtectedRoute element={<SubscriptionForm />} allowedRoles={["client"]} />} />
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

          {/* 🔹 Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </>
    );
  }

  return (
    <Router>
      <MainContent />
    </Router>
  );
}

export default App;
