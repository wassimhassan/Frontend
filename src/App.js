import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import FirstPage from "./components/FirstPage.js";
import SignUp from "./components/SignUp.js";
import Login from "./components/Login.js";
import Chat from "./components/Chat.js";
import Availability from "./components/TrainerAvailability.js";
import TrainerLogin from "./components/TrainerLogin.js";
import Navbar from "./components/Navbar.js";
import ProfileCard from "./components/ProfileCard.js";
import PTCard from "./components/PtCard.js";
import ResetPassword from "./components/ResetPassword.js";
import WelcomePage from "./components/WelcomePage.js";
import WorkoutPlan from "./components/WorkoutPlan.js";
import AssignWorkout from "./components/AssignWorkout.js";
import TrainerDashboard from "./components/TrainerDashboard.js";
import ClientDashboard from "./components/ClientDashboard.js";
import BookingsPage from "./components/BookingsPage.js";
import ViewBookings from "./components/ViewBookings.js";
import ViewAvailability from "./components/ViewAvailability.js";
import SubscriptionManagement from "./components/SubscriptionManagement.js";
import GymOwnerDashBoard from "./components/GymOwnerDashBoard.js";
import SubscriptionForm from "./components/SubscriptionForm.js";
import GymOwnerLogin from "./components/GymOwnerLogin.js";
import UnpaidClients from "./components/UnpaidClients.js";
import AISuggestions from "./components/AISuggestions.js";
import TrainerManagement from "./components/TrainerManagement.js";
import ChangePassword from "./components/ChangePassword.js";
import PaymentHistory from "./components/PaymentHistory.js";

function App() {
  console.log("App is rendering...");

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

    updateUserRole();
    window.addEventListener("storage", updateUserRole);

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

// 🔹 Secure Route Protection
const ProtectedRoute = ({ element, allowedRoles }) => {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token || !role) {
      setUserRole(null);
    } else {
      setUserRole(role);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) return null;

  if (!localStorage.getItem("token") || !allowedRoles.includes(userRole)) {
    // Clear invalid authentication data
    localStorage.clear();
    
    // Redirect based on the attempted role
    if (allowedRoles.includes("gymOwner")) return <Navigate to="/gym-owner-login" />;
    if (allowedRoles.includes("trainer")) return <Navigate to="/trainer-login" />;
    return <Navigate to="/login" />;
  }

  return element;
};

function MainContent({ trainerId, setTrainerId, userRole }) {
  const location = useLocation();
  const [isSigningUp, setIsSigningUp] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const hideNavbarPaths = ["/", "/WelcomePage", "/signup", "/login", "/reset-password", "/trainer-login", "/gym-owner-login"];

  return (
    <>
      {!hideNavbarPaths.includes(location.pathname) && isSigningUp && !isLoggingIn && <Navbar userRole={userRole} />}

      <Routes>
        {/* 🔹 Public Routes */}
        <Route path="/" element={<FirstPage />} />
        <Route path="/WelcomePage" element={<WelcomePage />} />
        <Route path="/signup" element={<SignUp setIsSigningUp={setIsSigningUp} />} />
        <Route path="/login" element={<Login setIsLoggingIn={setIsLoggingIn} />} />
        <Route path="/trainer-login" element={<TrainerLogin setTrainerId={setTrainerId} />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/gym-owner-login" element={<GymOwnerLogin />} />

        {/* 🔹 Client Routes */}
        {userRole === "client" && (
          <>
            <Route path="/profile" element={<ProtectedRoute element={<ProfileCard />} allowedRoles={["client"]} />} />
            <Route path="/chat" element={<ProtectedRoute element={<Chat />} allowedRoles={["client"]} />} />
            <Route path="/booking" element={<ProtectedRoute element={<BookingsPage />} allowedRoles={["client"]} />} />
            <Route path="/view-bookings" element={<ProtectedRoute element={<ViewBookings />} allowedRoles={["client"]} />} />
            <Route path="/subscribe" element={<ProtectedRoute element={<SubscriptionForm />} allowedRoles={["client"]} />} />
            <Route path="/client-dashboard" element={<ProtectedRoute element={<ClientDashboard />} allowedRoles={["client"]} />} />
            <Route path="/workout-plan" element={<ProtectedRoute element={<WorkoutPlan />} allowedRoles={["client"]} />} />
            <Route path="/aisuggestions" element={<ProtectedRoute element={<AISuggestions />} allowedRoles={["client"]} />} />
            <Route path="/payment-history" element={<ProtectedRoute element={<PaymentHistory />} allowedRoles={["client"]} />} />
          </>
        )}

        {/* 🔹 Trainer Routes */}
        {userRole === "trainer" && (
          <>
            <Route path="/profile" element={<ProtectedRoute element={<PTCard />} allowedRoles={["trainer"]} />} />
            <Route path="/chat" element={<ProtectedRoute element={<Chat />} allowedRoles={["trainer"]} />} />
            <Route path="/availability" element={<ProtectedRoute element={<Availability trainerId={trainerId} />} allowedRoles={["trainer"]} />} />
            <Route path="/view-availability" element={<ProtectedRoute element={<ViewAvailability />} allowedRoles={["trainer"]} />} />
            <Route path="/trainer-dashboard" element={<ProtectedRoute element={<TrainerDashboard />} allowedRoles={["trainer"]} />} />
            <Route path="/assign-workout" element={<ProtectedRoute element={<AssignWorkout />} allowedRoles={["trainer"]} />} />
          </>
        )}

        {/* 🔹 Gym Owner Routes */}
        {userRole === "gymOwner" && (
          <>
            <Route path="/gym-owner/dashboard" element={<ProtectedRoute element={<GymOwnerDashBoard />} allowedRoles={["gymOwner"]} />} />
            <Route path="/gym-owner/subscriptions" element={<ProtectedRoute element={<SubscriptionManagement />} allowedRoles={["gymOwner"]} />} />
            <Route path="/gym-owner/unpaid-clients" element={<ProtectedRoute element={<UnpaidClients />} allowedRoles={["gymOwner"]} />} />
            <Route path="/gym-owner/manage-trainers" element={<ProtectedRoute element={<TrainerManagement />} allowedRoles={["gymOwner"]} />} />
            <Route path="/gym-owner/change-password" element={<ProtectedRoute element={<ChangePassword />} allowedRoles={["gymOwner"]} />} />
          </>
        )}

        {/* 🔹 Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;