import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const GoogleSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthentication = () => {
      try {
        // Get parameters from the URL
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');
        const userId = searchParams.get('userId');
        const role = searchParams.get('role');

        console.log('Authentication parameters:', { token, userId, role });

        if (!token || !userId) {
          throw new Error('Missing authentication parameters');
        }

        // Store authentication data
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        localStorage.setItem('role', role || 'client');

        // Set a flag to indicate successful authentication
        localStorage.setItem('isAuthenticated', 'true');

        // Determine redirect path based on role
        let redirectPath;
        switch (role) {
          case 'client':
            redirectPath = '/profile';
            break;
          case 'trainer':
            redirectPath = '/availability';
            break;
          default:
            redirectPath = '/dashboard';
        }

        console.log('Redirecting to:', redirectPath);
        
        // Force a page reload to ensure all components re-render with new auth state
        window.location.href = redirectPath;
      } catch (error) {
        console.error('Authentication error:', error);
        navigate('/login', { 
          state: { error: 'Authentication failed. Please try again.' }
        });
      }
    };

    handleAuthentication();
  }, [navigate, location]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100vh'
    }}>
      <div className="loading-spinner"></div>
      <p style={{ marginTop: '20px' }}>Completing authentication...</p>
    </div>
  );
};

export default GoogleSuccess;