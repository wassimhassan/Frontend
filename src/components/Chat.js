// src/components/Chat.js
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom"; // to get the :otherUserId param
import axios from "axios";
import { io } from "socket.io-client";
import "./Chat.css";

const socket = io("http://localhost:5000", { autoConnect: false });

const Chat = ({ clientId, trainerId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Get logged-in user data from localStorage (should be set after login)
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId"); // directly get userId

  // Fetch chat history if both IDs are available
  useEffect(() => {
    socket.connect();
    socket.emit("joinRoom", { clientId, trainerId });

    // ✅ Fetch chat history
    axios
      .get(`http://localhost:5000/api/chat/${clientId}/${trainerId}`)
      .then((response) => setMessages(response.data))
      .catch((error) => console.error("Error fetching chat history", error));

    // ✅ Listen for new messages
    socket.on("receiveMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // ✅ Listen for typing indicator
    socket.on("userTyping", ({ sender }) => {
      if (sender !== clientId) setTyping(true);
      setTimeout(() => setTyping(false), 1000);
    });

    return () => {
      socket.disconnect();
    };
  }, [clientId, trainerId]);

  // ✅ Automatically Scroll to Bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      sender: currentUserId,
      receiver: otherUserId,
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    try {
      await axios.post("http://localhost:5000/api/chat/send", messageData);
      socket.emit("sendMessage", messageData);
      setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // ✅ Fix Typing Issue
  const handleTyping = () => {
    socket.emit("typing", { sender: clientId, receiver: trainerId });
  };

  return (
    <div className="chat-container">
      <div className="chat-history">
        {messages.length === 0 ? (
          <p className="no-messages">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender === clientId ? "client" : "trainer"}`}>
              <p>{msg.text}</p>
              <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
          ))
        )}
        {typing && <p className="typing-indicator">Trainer is typing...</p>}
        <div ref={chatEndRef} />
      </div>

      {/* ✅ Fix Input Field */}
      <div className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleTyping}  // ✅ Changed from onKeyPress to onKeyDown
          placeholder="Type a message..."
          className="chat-input-field"
        />
        <button className= "chat-button" onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;

