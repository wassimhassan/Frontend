import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

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

function App() {
  // For a trainer, we store the trainer’s ID in localStorage, or we might store it in "user"
  const [trainerId, setTrainerId] = useState(localStorage.getItem("trainerId") || null);
  // Retrieve the user’s role ("client" or "trainer") from localStorage
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || null);

  // JWT token
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      // If no token, we’re not logged in
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
      />
    </Router>
  );
}

/**
 * ProtectedRoute:
 * If there's no token or role, redirect to "/".
 * Otherwise, render the desired element.
 */
const ProtectedRoute = ({ element, userRole }) => {
  const token = localStorage.getItem("token");
  return token && userRole ? element : <Navigate to="/" />;
};

function MainContent({ trainerId, setTrainerId, userRole }) {
  const location = useLocation();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Paths where the Navbar should be hidden
  const hideNavbarPaths = [
    "/",
    "/WelcomePage",
    "/signup",
    "/login",
    "/reset-password",
    "/trainer-login",
  ];

  // Get the current user from localStorage
  // Make sure that after login, you store something like:
  // localStorage.setItem("user", JSON.stringify({ id: "mongoUserIdString", ... }));
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  // This is your own user’s ID
  const currentUserId = currentUser?.id || null;

  return (
    <>
      {/* Hide Navbar on specific paths */}
      {!hideNavbarPaths.includes(location.pathname) &&
        !isSigningUp &&
        !isLoggingIn && <Navbar userRole={userRole} />}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<FirstPage />} />
        <Route path="/WelcomePage" element={<WelcomePage />} />
        <Route path="/signup" element={<SignUp setIsSigningUp={setIsSigningUp} />} />
        <Route path="/login" element={<Login setIsLoggingIn={setIsLoggingIn} />} />
        <Route path="/trainer-login" element={<TrainerLogin setTrainerId={setTrainerId} />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Profile routes (client or trainer) */}
        {userRole === "client" && (
          <Route
            path="/profile"
            element={
              <ProtectedRoute element={<ProfileCard />} userRole={userRole} />
            }
          />
        )}
        {userRole === "trainer" && (
          <Route
            path="/profile"
            element={
              <ProtectedRoute element={<PTCard />} userRole={userRole} />
            }
          />
        )}

        {/* CLIENT routes */}
        {userRole === "client" && (
          <>
            {/*
              For a client, we assume:
              - currentUserId is the client's _id
              - trainerId is stored in localStorage or set after selecting a trainer
            */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute
                  userRole={userRole}
                  element={
                    <Chat
                      clientId={currentUserId}   // The client’s own _id
                      trainerId={trainerId}      // The trainer’s _id from localStorage
                    />
                  }
                />
              }
            />
            <Route
              path="/booking"
              element={
                <ProtectedRoute element={<BookingsPage />} userRole={userRole} />
              }
            />
            <Route
              path="/view-bookings"
              element={
                <ProtectedRoute element={<ViewBookings />} userRole={userRole} />
              }
            />
          </>
        )}

        {/* TRAINER routes */}
        {userRole === "trainer" && (
          <>
            {/*
              For a trainer, we assume:
              - currentUserId is the trainer’s _id
              - Possibly "trainerId" is not relevant or we store a "clientId" somewhere else
              - If you only want a single chat route, you'd need to store the client's ID in localStorage
            */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute
                  userRole={userRole}
                  element={
                    <Chat
                      // If you want to chat with a specific client, replace "null" with localStorage client ID
                      clientId={null}
                      trainerId={currentUserId}
                    />
                  }
                />
              }
            />
            <Route
              path="/availability"
              element={
                <ProtectedRoute
                  element={<Availability trainerId={trainerId} />}
                  userRole={userRole}
                />
              }
            />
            <Route
              path="/view-availability"
              element={
                <ProtectedRoute
                  element={<ViewAvailability />}
                  userRole={userRole}
                />
              }
            />
          </>
        )}

        {/* Catch-all: redirect unknown routes to "/" */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;