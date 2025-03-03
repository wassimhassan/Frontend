import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./Chat.css";


const socket = io("http://localhost:5000"); // Connect to backend WebSocket server

const Chat = ({ clientId, trainerId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Fetch chat history on component mount
    axios
      .get(`http://localhost:5000/api/chat/${clientId}/${trainerId}`)
      .then((response) => setMessages(response.data))
      .catch((error) => console.error("Error fetching chat history", error));

    // Listen for real-time messages
    socket.on("receiveMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("receiveMessage"); // Cleanup listener
    };
  }, [clientId, trainerId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const messageData = {
      sender: clientId,
      receiver: trainerId,
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    try {
      await axios.post("http://localhost:5000/api/chat/send", messageData);
      socket.emit("sendMessage", messageData); // Emit message to WebSocket
      setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-history">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === clientId ? "client" : "trainer"}`}
          >
            <p>{msg.text}</p>
            <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
