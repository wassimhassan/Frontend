import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './Chat.css';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000';

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  if (!id) return false;
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  return objectIdPattern.test(id);
};

const ErrorDisplay = ({ error, onDismiss }) => (
  <div className="error-banner">
    <p>{error}</p>
    <button onClick={onDismiss} className="dismiss-button">Dismiss</button>
  </div>
);

const Chat = () => {
  const navigate = useNavigate();
  
  // Robust token and user retrieval with validation
  const token = localStorage.getItem('token') || '';
  const userId = localStorage.getItem('userId') || '';
  const role = localStorage.getItem('role') || 'client';

  // State variables
  const [socket, setSocket] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState({
    users: false,
    messages: false,
    send: false
  });
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Validate token and user ID before socket connection
  const isValidConnection = () => {
    if (!token) {
      setError('No authentication token found. Please log in again.');
      return false;
    }
    
    if (!userId) {
      setError('User ID not found. Please log in again.');
      return false;
    }
    
    // Make ObjectId validation optional to prevent blocking valid users
    // with different ID formats
    if (userId.length === 24 && !isValidObjectId(userId)) {
      console.warn('User ID format may be invalid:', userId);
    }
    
    return true;
  };

  // Dismiss error message
  const dismissError = () => {
    setError(null);
    
    // Only redirect to login if token is completely missing
    if (!token) {
      handleLogout();
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    
    // Redirect to login page
    navigate('/login');
  };

  // Initialize Socket Connection with improved error handling
  useEffect(() => {
    if (!isValidConnection()) {
      return;
    }

    const newSocket = io(API_BASE_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setError(null);  // Clear any previous connection errors
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to establish socket connection. Please refresh the page.');
    });

    newSocket.on('receiveMessage', (message) => {
      console.log('Received message:', message);
      if (
        (selectedUser && 
        (message.sender === selectedUser._id || message.receiver === selectedUser._id) &&
        (message.sender === userId || message.receiver === userId)) ||
        // Also add messages if they involve the current user
        (!selectedUser && (message.sender === userId || message.receiver === userId))
      ) {
        setMessages(prevMessages => [...prevMessages, message]);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setError('Socket disconnected. Reconnecting...');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, userId]);  // Removed selectedUser from dependencies

  // Fetch Users List with comprehensive error handling
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isValidConnection()) {
        return;
      }

      setLoading(prev => ({ ...prev, users: true }));
      setError(null);

      try {
        // Updated endpoints to match your backend routes
        const endpoint = role === 'client' 
          ? `${API_BASE_URL}/api/trainers/trainers` 
          : `${API_BASE_URL}/api/trainers/trainer/clients`;
        
        console.log(`Fetching users from endpoint: ${endpoint}`);
        
        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Users response:', response.data);
        
        // Handling different response formats
        let usersArray;
        if (Array.isArray(response.data)) {
          usersArray = response.data;
        } else if (response.data.trainers) {
          usersArray = response.data.trainers;
        } else if (response.data.clients) {
          usersArray = response.data.clients;
        } else {
          usersArray = [];
        }
        
        console.log('Before processing:', usersArray);
        
        // Process users but don't filter by ObjectId to avoid excluding valid users
        const processedUsers = usersArray
          .filter(user => user) // Only filter out null/undefined users
          .map(user => ({
            ...user,
            id: user._id || user.id // Ensure we have an id property
          }));
        
        console.log('After processing:', processedUsers);
        
        setUsers(processedUsers);
        
        if (processedUsers.length > 0 && !selectedUser) {
          setSelectedUser(processedUsers[0]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        const errorMsg = error.response?.data?.message || 'Failed to load users. Please try again.';
        setError(errorMsg);
        
        // Only redirect on 401 errors, not on all errors
        if (error.response?.status === 401) {
          handleLogout();
        }
      } finally {
        setLoading(prev => ({ ...prev, users: false }));
      }
    };

    fetchUsers();
  }, [role, token, userId, navigate]); // Removed selectedUser from dependencies

  // Fetch Chat History with comprehensive validation
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!selectedUser) {
        console.log('No user selected, skipping chat history fetch');
        return;
      }
      
      if (!isValidConnection()) {
        return;
      }
    
      // Make sure we're using valid MongoDB ObjectIds
      const selectedUserId = selectedUser._id || selectedUser.id;
      
      // Log but don't block on ObjectId validation
      if (selectedUserId && selectedUserId.length === 24 && !isValidObjectId(selectedUserId)) {
        console.warn('Selected user ID may be invalid:', selectedUserId);
      }
      
      console.log(`Fetching chat history between ${userId} and ${selectedUserId}`);
      
      setLoading(prev => ({ ...prev, messages: true }));
      setError(null);
  
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/chat/${userId}/${selectedUserId}`, 
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
    
        console.log('Chat history response:', response.data);
        
        // Handle the response structure properly
        const messagesArray = response.data.messages || [];
        
        // Sort messages by timestamp
        const sortedMessages = messagesArray.sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        setMessages(sortedMessages);
      } catch (error) {
        console.error('Chat history error:', error);
        
        const errorMessage = error.response?.data?.message || 
          'Failed to load chat history. Please try again.';
        
        setError(errorMessage);
        
        // Only redirect on 401 errors
        if (error.response?.status === 401) {
          handleLogout();
        }
      } finally {
        setLoading(prev => ({ ...prev, messages: false }));
      }
    };
  
    fetchChatHistory();
  }, [selectedUser, userId, token, navigate]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Message Function with improved validation
  const sendMessage = async () => {
    if (!newMessage.trim()) {
      console.log('Empty message, not sending');
      return;
    }
  
    if (!selectedUser) {
      setError('Please select a user to chat with');
      return;
    }
  
    if (!socket) {
      setError('Chat connection not established. Please refresh the page.');
      return;
    }
  
    if (!isValidConnection()) {
      return;
    }
  
    const selectedUserId = selectedUser.id || selectedUser._id;
  
    // Log but don't block on ObjectId validation
    if (selectedUserId && selectedUserId.length === 24 && !isValidObjectId(selectedUserId)) {
      console.warn('Selected user ID may be invalid for message:', selectedUserId);
    }
  
    setLoading(prev => ({ ...prev, send: true }));
    setError(null);
  
    const messageData = {
      sender: userId,
      receiver: selectedUserId,
      text: newMessage,
      timestamp: new Date().toISOString()
    };
  
    try {
      console.log('Sending message:', messageData);
  
      // Send via REST API for persistence
      const response = await axios.post(`${API_BASE_URL}/api/chat/send`, messageData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      console.log('Message sent response:', response.data);
  
      // Update the state with the message data only once from the API response
      const savedMessage = response.data.data || messageData;
  
      // Emit the message via Socket for real-time delivery
      socket.emit('sendMessage', savedMessage);
  
      // Update the message state only once
      setMessages(prevMessages => [...prevMessages, savedMessage]);
  
      setNewMessage('');
    } catch (error) {
      console.error('Message send failed:', error);
      const errorMsg = error.response?.data?.message || 
                        error.response?.data?.details || 
                        'Failed to send message. Please try again.';
      setError(errorMsg);
  
      // Only redirect on 401 errors
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(prev => ({ ...prev, send: false }));
    }
  };    

  // Handle message input and typing
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
    
    if (socket && selectedUser) {
      // Emit typing event to socket
      const selectedUserId = selectedUser.id || selectedUser._id;
      socket.emit('typing', { 
        sender: userId, 
        receiver: selectedUserId 
      });
      
      setIsTyping(true);
      
      // Stop typing after 1 second of inactivity
      setTimeout(() => setIsTyping(false), 1000);
    }
  };

  // Handle keyboard events for sending message
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle input field auto-growth
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  // Render component
  return (
    <div className="chat-container">
      {error && (
        <ErrorDisplay error={error} onDismiss={dismissError} />
      )}

      {!token ? (
        <div className="login-required">
          <p>Please log in to access chat</p>
          <button onClick={() => navigate('/login')} className="login-button">Log In</button>
        </div>
      ) : (
        <div className="chat-wrapper">
          {/* User List */}
          <div className="user-list">
            <h3>{role === 'client' ? 'Your Trainers' : 'Your Clients'}</h3>
            {loading.users ? (
              <p className="loading">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="no-users">No users found</p>
            ) : (
              users.map(user => (
                <div 
                  key={user.id || user._id || Math.random().toString()} // Fallback key if no ID
                  className={`user-item ${selectedUser && (selectedUser._id === user._id || selectedUser.id === user.id) ? 'active' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  {user.name || user.username || 'Unknown User'}
                </div>
              ))
            )}
          </div>

          {/* Chat Box */}
          <div className="chat-box">
            {selectedUser ? (
              <>
                <div className="chat-header">
                  <h3>Chat with {selectedUser.name || selectedUser.username || 'User'}</h3>
                </div>
                
                <div className="messages-container">
                  {loading.messages ? (
                    <div className="loading">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="no-messages">
                      <p>No messages yet. Start a conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div 
                        key={`${msg._id || msg.timestamp}-${index}`} 
                        className={`message ${msg.sender === userId ? 'sent' : 'received'}`}
                      >
                        <p>{msg.text}</p>
                        <span className="timestamp">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                  {isTyping && (
                    <div className="typing-indicator">
                      {selectedUser.name || selectedUser.username || 'User'} is typing...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="message-composer">
                  <div className="message-input-container">
                    <textarea 
                      ref={textareaRef}
                      value={newMessage}
                      onChange={handleMessageChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      rows={1}
                      className="message-textarea"
                    />
                    <button 
                      className="send-button" 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || loading.send}
                      aria-label="Send message"
                    >
                      {loading.send ? (
                        <span className="sending">...</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="send-icon">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="select-user-prompt">
                <p>Select a user to start chatting</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;