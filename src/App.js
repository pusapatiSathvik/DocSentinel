import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import UserDashboard from './components/UserDashboard'; // To be created
import InstituteDashboard from './components/InstituteDashboard'; // To be created
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; // For any custom CSS

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard/user" element={<UserDashboard />} />
          <Route path="/dashboard/institute" element={<InstituteDashboard />} />
          {/* Future: Add ProtectedRoute wrapper around dashboards */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;