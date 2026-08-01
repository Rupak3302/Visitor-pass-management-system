import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { Search, Plus, Trash2, ShieldBan, CheckCircle, ShieldCheck, User, Users as UsersIcon, X } from "lucide-react";
import toast from "react-hot-toast";
import { getAllUsers, registerUser, toggleUserStatus, deleteUser } from "../../../services/usersApi";


const UsersManagement = () => {
    const { user } = useContext(AuthContext); // Grab the logged-in user from context

    // State Management 
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ total: 0, deactivated: 0, deleted: 0 });
    const [ searchTerm, setSearchTerm ] = useState('');
    const [ roleFilter, setRoleFilter ] = useState('All');

    // Modal state
    const [ isAddModalOpen, setIsAddModalOpen ] = useState(false);
    const [ formData, setFormData ] = useState({
        name: '', email: '', password: '', phone: '', role: 'host'
    });

    // Api Calls
    const fetchUsers = async () => {
        try {
            const data = await getAllUsers(roleFilter, searchTerm);
            
            if (data.success) {
                setUsers(data.users);
                setStats(data.stats);
            }

        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Error fetching users');
        }
    };

    // Re-run fetchUsers when Filter or search changes
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [roleFilter, searchTerm]);

    // Handle Add User
    const handleAddUser = async (e) => {
        e.preventDefault();

        try {

            const payload = {
                ...formData,
                organizationName: user.organizationName // Ensure the new user is tied to the same organization
            }

            await registerUser(payload);
            
            setIsAddModalOpen(false);
            setFormData({ name: '', email: '', password: '', phone: '', role: 'host' });
            fetchUsers(); // Refresh table
            toast.success('User added successfully');
        } catch (error) {
            console.error('Error adding user:', error);
            toast.error(error.response?.data?.message || 'Failed to add user');            
        }
    };

    // Handle status toggle
    const handleStatusToggle = async (id) => {
        if (!window.confirm('Are you sure you want to changes this users status?')) return;

        try {
            await toggleUserStatus(id);
            fetchUsers(); // Refresh table
            toast.success('User status changed successfully');
        } catch (error) {
            console.error('Error toggling user status:', error);
            toast.error(error.response?.data?.message || 'Failed to update user status');
        }
    };

    // Handle delete user permanently
    const handleDeleteUser = async (id) => {
        if (!window.confirm('WARNING: Are you sure you want to permanently delete this user?')) return;

        try {
            await deleteUser(id);
            fetchUsers(); // Refresh
            toast.success('User permanently deleted successfully');
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    // Helper functions
    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin': return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Admin</span>;
            case 'host': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Host</span>;
            case 'security': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Security</span>;
            default: return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{role}</span>;
        }
    };

    return (
        <div className="flex flex-col h-full">
            
            {/* HEADER SECTION */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Users Management</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Manage system users like create, active, deactivate, delete</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-blue-200"
                >
                    <Plus className="w-5 h-5" />
                    Add New User
                </button>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between border-l-4 border-l-blue-500">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Users</p>
                        <h3 className="text-3xl font-black text-slate-800">{stats.total}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                        <UsersIcon className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between border-l-4 border-l-orange-500">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Deactivated</p>
                        <h3 className="text-3xl font-black text-slate-800">{stats.deactivated}</h3>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                        <ShieldBan className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between border-l-4 border-l-red-500">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Deleted</p>
                        <h3 className="text-3xl font-black text-slate-800">{stats.deleted}</h3>
                    </div>
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                        <Trash2 className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* FILTER & SEARCH BAR */}
            <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 gap-4">
                {/* Role Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-full lg:w-auto">
                    {['All', 'Admin', 'Host', 'Security'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setRoleFilter(tab)}
                            className={`flex-1 lg:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                                roleFilter === tab 
                                    ? 'bg-white text-slate-800 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full lg:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    />
                </div>
            </div>

            {/* USERS TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.length > 0 ? (
                                 users.map((u) => (
                                <tr key={u._id} 
                                className={`hover:bg-slate-50 transition-colors ${!u.isActive ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            {/* Initials Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{u.name} {!u.isActive && '(Deactivated)'}</p>
                                                <p className="text-xs font-medium text-slate-500">{u.email}</p>
                                                <p className="text-xs font-medium text-slate-500">{u.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getRoleBadge(u.role)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-semibold text-slate-700">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-3">
                                            <button 
                                            onClick={() => handleStatusToggle(u._id)}
                                            className={`flex items-center gap-1 text-xs font-bold transition-colors ${u.isActive ? 'text-orange-500 hover:text-orange-700' : 'text-green-500 hover:text-green-700'}`}>
                                                {u.isActive ? <><ShieldBan className="w-4 h-4"/> Deactivate</> : <><CheckCircle className="w-4 h-4"/> Activate</>}
                                            </button>
                                            <span className="text-slate-300">|</span>
                                            <button 
                                            onClick={() => handleDelete(u._id)}
                                            className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                                                <Trash2 className="w-4 h-4"/> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) 
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-medium">
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* ADD USER MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-black text-slate-800">Add New User</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name *</label>
                                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address *</label>
                                <input type="email" autoComplete="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="john@example.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number *</label>
                                <input type="tel" required value={formData.phone} autoComplete="tel" onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+1 234 567 8900" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Temporary Password *</label>
                                <input type="password" required minLength="6" autoComplete="new-password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Min. 6 characters" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Role *</label>
                                <select required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700">
                                    <option value="host">Host</option>
                                    <option value="security">Security Guard</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">Register User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersManagement;