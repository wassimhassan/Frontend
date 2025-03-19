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
import PTCard from "./components/PtCard";
import ResetPassword from "./components/ResetPassword";
import WelcomePage from "./components/WelcomePage";
import WorkoutPlan from "./components/WorkoutPlan";
import AssignWorkout from "./components/AssignWorkout";
import TrainerDashboard from "./components/TrainerDashboard";
import ClientDashboard from "./components/ClientDashboard";
import BookingsPage from "./components/BookingsPage";
import ViewBookings from "./components/ViewBookings";
import ViewAvailability from "./components/ViewAvailability";
import SubscriptionManagement from "./components/SubscriptionManagement";
import GymOwnerDashBoard from "./components/GymOwnerDashBoard";
import ManageSubscription from "./components/ManageSubscription";
import SubscriptionForm from "./components/SubscriptionForm"; 
import PaymentsPage from "./components/PaymentsPage"; 
import GymOwnerLogin from "./components/GymOwnerLogin";
import UnpaidClients from "./components/UnpaidClients"; 

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
      <MainContent
        trainerId={trainerId}
        setTrainerId={setTrainerId}
        userRole={userRole}
      />
    </Router>
  );
}

// 🔹 Secure Route Protection
const ProtectedRoute = ({ element, allowedRoles }) => {
  const [userRole, setUserRole] = useState(localStorage.getItem("role"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setUserRole(storedRole);
    setIsLoading(false); // ✅ Prevents premature redirection
  }, []);

  if (isLoading) return null; // ✅ Prevents redirecting before loading

  if (!localStorage.getItem("token") || !allowedRoles.includes(userRole)) {
    console.log("❌ Unauthorized access, redirecting...");
    
    if (userRole === "gymOwner") return <Navigate to="/gym-owner-login" />;
    if (userRole === "trainer") return <Navigate to="/trainer-login" />;
    
    return <Navigate to="/login" />;
  }

  return element;
};

function MainContent({ trainerId, setTrainerId, userRole }) {
  const location = useLocation();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const hideNavbarPaths = ["/", "/WelcomePage", "/signup", "/login", "/reset-password", "/trainer-login", "/gym-owner-login"];

  return (
    <>
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

        {/* 🔹 Client Routes */}
        {userRole === "client" && (
          <>
            <Route path="/profile" element={<ProtectedRoute element={<ProfileCard />} allowedRoles={["client"]} />} />
            <Route path="/chat" element={<ProtectedRoute element={<Chat />} allowedRoles={["client"]} />} />
            <Route path="/booking" element={<ProtectedRoute element={<BookingsPage />} allowedRoles={["client"]} />} />
            <Route path="/view-bookings" element={<ProtectedRoute element={<ViewBookings />} allowedRoles={["client"]} />} />
            <Route path="/payments" element={<ProtectedRoute element={<PaymentsPage />} allowedRoles={["client"]} />} />
            <Route path="/subscribe" element={<ProtectedRoute element={<SubscriptionForm />} allowedRoles={["client"]} />} />
            <Route path="/client-dashboard" element={<ProtectedRoute element={<ClientDashboard />} allowedRoles={["client"]} />} />
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
            <Route path="/workout-plan" element={<ProtectedRoute element={<WorkoutPlan />} allowedRoles={["trainer"]} />} />
            <Route path="/assign-workout" element={<ProtectedRoute element={<AssignWorkout />} allowedRoles={["trainer"]} />} />
          </>
        )}

        {/* 🔹 Gym Owner Routes */}
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

export default App;