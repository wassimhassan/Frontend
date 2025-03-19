import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./Chat.css";

const Chat = () => {
  const role = localStorage.getItem("role") || "client";
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]); 
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);
  
  // 🚨 Log userId and token for debugging
  useEffect(() => {
    console.log("🔍 userId from Local Storage:", userId);
    console.log("🔍 Token from Local Storage:", token);
  }, []);

  // ✅ Prevent API calls if token or userId is missing
  useEffect(() => {
    if (!token || !userId) {
      console.error("🚨 Missing token or userId! Chat cannot load.");
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = role === "client"
          ? await axios.get("http://localhost:5000/api/trainers/trainers", {
              headers: { Authorization: `Bearer ${token}` }
            })
          : await axios.get("http://localhost:5000/api/trainers/trainer/clients", {
              headers: { Authorization: `Bearer ${token}` }
            });

        setUsers(response.data || []); // Ensure users is always an array
      } catch (error) {
        console.error("❌ Error fetching users:", error.response?.data || error.message);
      }
    };

    fetchUsers();
  }, [role, token, userId]);

  // ✅ Fetch Chat History (Only if token, userId, and selectedUser are valid)
  useEffect(() => {
    if (!token || !userId || !selectedUser?.id) {
      console.warn("⚠️ Skipping chat fetch: Missing token, userId, or selected user.");
      return;
    }

    console.log(`🔄 Fetching chat history for ${userId} ↔️ ${selectedUser.id}`);

    const fetchMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/chat/${userId}/${selectedUser.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setMessages(response.data || []);
      } catch (error) {
        console.error("❌ Error fetching chat history:", error.response?.data || error.message);
      }
    };

    fetchMessages();
  }, [selectedUser, token, userId]);

  // ✅ Automatically Scroll to Bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Send Message with Proper Token
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser?.id || !token || !userId) {
      console.error("🚨 Cannot send message: Missing token, userId, or selected user.");
      return;
    }

    const messageData = {
      sender: userId,
      receiver: selectedUser.id,
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    try {
      await axios.post("http://localhost:5000/api/chat/send", messageData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });

      setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage("");
    } catch (error) {
      console.error("❌ Error sending message:", error.response?.data || error.message);
    }
  };

  return (
    <div className="chat-container">
      {!token || !userId ? (
        <p className="error-message">⚠️ You need to log in to access chat.</p>
      ) : (
        <>
          <div className="user-list">
            <h3>{role === "client" ? "Select a Trainer" : "Select a Client"}</h3>
            {users.length === 0 ? (
              <p className="no-users">No users found</p>
            ) : (
              users.map((user, index) => (
                <div
                  key={user.id || index} // ✅ Fixed missing key issue
                  className={`user-item ${selectedUser?.id === user.id ? "active" : ""}`}
                  onClick={() => setSelectedUser(user)}
                >
                  {user.name}
                </div>
              ))
            )}
          </div>

          <div className="chat-box">
            {selectedUser ? (
              <>
                <h3>Chat with {selectedUser.name}</h3>
                <div className="chat-history">
                  {messages.length === 0 ? (
                    <p className="no-messages">No messages yet. Start the conversation!</p>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={index} // ✅ Fixed missing key issue
                        className={`message ${msg.sender === userId ? "sent" : "received"}`}
                      >
                        <p>{msg.text}</p>
                        <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                  {typing && <p className="typing-indicator">User is typing...</p>}
                  <div ref={chatEndRef} />
                </div>

                <div className="chat-input">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={() => setTyping(true)}
                    onKeyUp={() => setTimeout(() => setTyping(false), 1000)}
                    placeholder="Type a message..."
                    className="chat-input-field"
                  />
                  <button className="chat-button" onClick={sendMessage}>Send</button>
                </div>
              </>
            ) : (
              <p className="select-user">Select a user to start chatting</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;