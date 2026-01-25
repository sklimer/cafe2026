import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './components/Dashboard';
import Restaurants from './components/Restaurants';
import MenuManagement from './components/MenuManagement';
import Orders from './components/Orders';
import Users from './components/Users';
import Promotions from './components/Promotions';
import Analytics from './components/Analytics';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('admin_token');
  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div style={{ display: 'flex' }}>
                <Sidebar />
                <div style={{ flexGrow: 1 }}>
                  <Header />
                  <main style={{ padding: '20px' }}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/restaurants" element={<Restaurants />} />
                      <Route path="/menu" element={<MenuManagement />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/promotions" element={<Promotions />} />
                      <Route path="/analytics" element={<Analytics />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;