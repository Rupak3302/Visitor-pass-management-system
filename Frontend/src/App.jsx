import { Import } from "lucide-react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Imports our page components
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterVisitor from "./pages/RegisterVisitor"
import Dashboard from "./pages/Dashboard";

function App() {

    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/register-visitor" element={<RegisterVisitor />} />
            </Routes>
        </Router>
    );
}

export default App;
