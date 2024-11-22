import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/common/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import ManagerDashboard from './components/manager/ManagerDashboard';
import AddManager from './components/admin/AddManager';
import AddHostel from './components/admin/AddHostel';
import HostelList from './components/admin/HostelList';
import HostlerEntry from './components/manager/HostlerEntry';
import RoomAvailability from './components/manager/RoomAvailability';
import Notification from './components/manager/Notification';
import PaymentTracking from './components/manager/PaymentTracking';
import RoomChangeTracking from './components/manager/RoomChangeTracking';
import CSVPage from './components/manager/CSVPage';
import Profile from './components/common/Profile';
import DashboardOverview from './components/manager/DashboardOverview';
import HostelInfo from './components/manager/HostelInfo';
import HostlerList from './components/manager/HostlerList';
import ReportPage from './components/admin/ReportPage';
import ExpensePage from './components/manager/ExpensePage'; // Import ExpensePage
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/admin/add-manager" element={<AddManager />} />
        <Route path="/admin/add-hostel" element={<AddHostel />} />
        <Route path="/admin/hostel-list" element={<HostelList />} />
        <Route path="/manager/hostler-entry" element={<HostlerEntry />} />
        <Route path="/manager/room-availability" element={<RoomAvailability />} />
        <Route path="/manager/notification" element={<Notification />} />
        <Route path="/manager/payment-tracking" element={<PaymentTracking />} />
        <Route path="/manager/room-change-tracking" element={<RoomChangeTracking />} />
        <Route path="/manager/csv" element={<CSVPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/manager/dashboard-overview" element={<DashboardOverview />} />
        <Route path="/manager/hostel-info" element={<HostelInfo />} />
        <Route path="/manager/hostler-list" element={<HostlerList />} />
        <Route path="/admin/report-page" element={<ReportPage />} />
        <Route path="/manager/expense-page" element={<ExpensePage />} /> {/* Add Route for ExpensePage */}
      </Routes>
    </Router>
  );
}

export default App;
