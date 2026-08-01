import { Import } from "lucide-react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Imports our page components
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterVisitor from "./pages/RegisterVisitor"
import RegisterOrg from "./pages/RegisterOrg";
import Navbar from "./components/Navbar";
import HostPanel from "./pages/dashboards/HostPanel";
import QRScanner from "./components/QRScanner";
import SecurityPanel from "./pages/dashboards/SecurityPanel";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/dashboards/AdminPanel/AdminDashboard";
import UsersManagement from "./pages/dashboards/AdminPanel/UsersManagement";
import VisitorsManagement from "./pages/dashboards/AdminPanel/VisitorsManagement";
import AppointmentsManagement from "./pages/dashboards/AdminPanel/AppointmentsManagement";
import PassesManagement from "./pages/dashboards/AdminPanel/PassesManagement";
import LogsManagement from "./pages/dashboards/AdminPanel/LogsManagement";
import ReportsManagement from './pages/dashboards/AdminPanel/ReportsManagement';




function App() {

    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register-visitor" element={<RegisterVisitor />} />
                <Route path="/register-org" element={<RegisterOrg />} />
                <Route path="/dashboard" element={<Navbar />} />
                <Route path="/host-panel" element={<HostPanel />} />
                <Route path="/scanner" element={<QRScanner />} />
                <Route path="/security-panel" element={<SecurityPanel />} />
                <Route path="/admin" element={<AdminLayout />} >

                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<UsersManagement />} />
                    <Route path="visitors" element={<VisitorsManagement />} />
                    <Route path="appointments" element={<AppointmentsManagement />} />
                    <Route path="passes" element={<PassesManagement />} />
                    <Route path="checklogs" element={<LogsManagement />} />
                    <Route path="reports" element={<ReportsManagement />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
