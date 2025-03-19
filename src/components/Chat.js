// src/components/Chat.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // to get the :otherUserId param
import axios from "axios";
import "./Chat.css";

const Chat = () => {
  const { otherUserId } = useParams(); 
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Get logged-in user data from localStorage (should be set after login)
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId"); // directly get userId

  // Fetch chat history if both IDs are available
  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    axios
      .get(
        `${process.env.REACT_APP_BACKEND_URL}/api/chat/${currentUserId}/${otherUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        setMessages(response.data);
      })
      .catch((error) => {
        console.error("Error fetching chat history:", error);
      });
  }, [currentUserId, otherUserId, token]);

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!currentUserId || !otherUserId) return;

    const messageData = {
      sender: currentUserId,
      receiver: otherUserId,
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/chat/send`,
        messageData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-history">
        {messages.map((msg, index) => {
          const isCurrentUser = msg.sender === currentUserId;
          return (
            <div
              key={index}
              className={`message ${isCurrentUser ? "client" : "trainer"}`}
            >
              <p>{msg.text}</p>
              <span className="timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ color: "#000" }}  // Ensures text is visible
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
