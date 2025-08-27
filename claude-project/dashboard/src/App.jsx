import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;