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
    console.log("Checking user authentication...");
    if (!token) {
      setUserRole(null);
    } else {
      setUserRole(localStorage.getItem("role"));
    }
  }, [token]);

  // ✅ Redirects to login if user is not authenticated or has wrong role
  const ProtectedRoute = ({ element, allowedRoles }) => {
    const userRole = localStorage.getItem("role");  // ✅ Fetch the latest role
  
    console.log("🚀 Checking ProtectedRoute:", { userRole, allowedRoles });
  
    if (!token || !allowedRoles.includes(userRole)) {
      console.log("❌ Unauthorized access, redirecting to correct login page...");
      
      // ✅ Redirect Gym Owners to Gym Owner Login
      if (userRole === "gymOwner") return <Navigate to="/gym-owner-login" />;  
  
      // ✅ Redirect Trainers to Trainer Login
      if (userRole === "trainer") return <Navigate to="/trainer-login" />;  
  
      // ✅ Default Redirect for Unauthenticated Users
      return <Navigate to="/login" />;
    }
    return element;
  };
  
  
  function MainContent() {
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

          {/* 🔹 Trainer-Only Routes */}
          {userRole === "trainer" && (
            <>
              <Route path="/profile" element={<ProtectedRoute element={<PTCard />} allowedRoles={["trainer"]} />} />
              <Route path="/chat" element={<ProtectedRoute element={<Chat />} allowedRoles={["trainer"]} />} />
              <Route path="/availability" element={<ProtectedRoute element={<Availability trainerId={trainerId} />} allowedRoles={["trainer"]} />} />
              <Route path="/view-availability" element={<ProtectedRoute element={<ViewAvailability />} allowedRoles={["trainer"]} />} />
            </>
          )}

          {/* 🔹 Gym Owner-Only Routes */}
          {userRole === "gymOwner" && (
            <>
              <Route path="/gym-owner/dashboard" element={<ProtectedRoute element={<GymOwnerDashBoard />} allowedRoles={["gymOwner"]} />} />
              <Route path="/gym-owner/subscriptions" element={<ProtectedRoute element={<SubscriptionManagement />} allowedRoles={["gymOwner"]} />} />
              <Route path="/gym-owner/payments" element={<ProtectedRoute element={<ManageSubscription />} allowedRoles={["gymOwner"]} />} />
              <Route path="/gym-owner/unpaid-clients" element={<ProtectedRoute element={<UnpaidClients />} allowedRoles={["gymOwner"]} />} /> 
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
