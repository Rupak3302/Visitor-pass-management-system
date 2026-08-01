import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Users, UserCheck, CalendarDays, Ticket, ClipboardCheck, FileText, LogOut, Shield } from 'lucide-react';

const AdminLayout = () => {
    const navigate = useNavigate();

    const { user, logout } = useContext(AuthContext);

    const handleLogout = () => {
        logout(); // Clears the token from the browser memory!
        navigate('/login');
    }

    // Navigation Items for the Admin Dashboard
    const navItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Users', path: '/admin/users', icon: Users },
        { name: 'Visitors', path: '/admin/visitors', icon: UserCheck },
        { name: 'Appointments', path: '/admin/appointments', icon: CalendarDays },
        { name: 'Passes', path: '/admin/passes', icon: Ticket },
        { name: 'Check Logs', path: '/admin/checklogs', icon: ClipboardCheck },
        { name: 'Reports', path: '/admin/reports', icon: FileText }
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
            {/* Fixed Left Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-20 flex-shrink-0">

                {/* Logo section */}
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <Shield className="w-7 h-7 text-blue-600 mr-2.5" />
                    <span className="text-xl font-black text-slate-800 tracking-tight">SecurePass</span>
                </div>

                {/* Navigation Links section */}
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
                    {navItems.map((item, index) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
                                isActive
                                    ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50'
                                    : 'text-slate-500 hover:bg-blue-50 hover:text-blue-700'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Profile section & Logout */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                    {/* User Info */}
                    <div className="flex items-center gap-3 px-2 w-full">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg  border border-blue-200 shrink-0">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col items-start justify-center overflow-hidden w-full">
                            <p className="text-sm font-bold text-slate-800 truncate w-full" title={user?.name}>
                                {user?.name}
                            </p>
                            <p className="text-[10px] font-bold text-blue-600 bg-blue-100/60 border border-blue-200 px-2 py-0.5 rounded w-fit uppercase tracking-wider mt-1">
                                {user?.role}
                            </p>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-slate-600 rounded-xl text-sm font-bold transition-colors shadow-sm">
                            <LogOut className="w-4 h-4" />
                            Logout
                    </button>
                </div>
            </aside>

            {/* Main Dynamic Content Area */}
            <main className="flex-1 h-full overflow-y-auto no-scrollbar bg-slate-50/50">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
