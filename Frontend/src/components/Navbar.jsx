// IMPORTING NECESSARY TOOLS
import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, UserCircle } from 'lucide-react';

// import AdminPanel from '../pages/dashboards/AdminPanel';
import HostPanel from '../pages/dashboards/HostPanel';
import SecurityPanel from '../pages/dashboards/SecurityPanel';


function Navbar() {
  // Grab the logged-in user data and the logout function from our Context
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // I use useEffect because after the react finishes checking the page then redirect happens safely
  // useEffect(() => {
  //   // Only register user can logged in
  //   if (!user) {
  //     navigate('/login');
  //   }
  // }, [user, navigate]);

  useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (user.role === 'admin') {
            // Instantly redirect admins to their new layout!
            navigate('/admin/users'); 
        }
    }, [user, navigate]);

  // Only register user can logged in
  if (!user) {
    return null;
  }

  // this is the logout function
  const handleLogout = () => {
    logout(); // Clears the token and state
    navigate('/'); // Sends them back to the landing page
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Dashboard Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-4 bg-white shadow-sm border-b border-slate-200">

        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-slate-800">SecurePass</span>
        </div>

        <div className="flex items-center gap-6">
          {/* Displays the logged in user's name */}
          <div className="flex items-center gap-2 text-slate-600">
            <UserCircle className="w-5 h-5" />
            <span className="font-medium">{user.name}</span>
            <span className="font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">{user.role}</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 transition bg-red-50 rounded-lg hover:bg-red-100"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>

      {/* Content Area */}
      <main className="max-w-7xl px-8 mx-auto pt-20 pb-10">

        {/* Role-Based Dashboard Placeholder */}
        <div className="mt-8 mb-8">
          {/* {user.role === 'admin' && <AdminPanel />} */}
          {user.role === 'host' && <HostPanel />}
          {user.role === 'security' && <SecurityPanel />}

        </div>

      </main>
    </div>
  );
}

export default Navbar;