import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Building, User, Mail, Lock, ArrowLeft, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { registerUser } from "../services/usersApi"; // Uses your existing API service

const RegisterOrg = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        organizationName: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'admin' // Force the role to admin for the company creator!
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await registerUser(formData);
            if (res.token) {
                toast.success("Organization Registered Successfully! Please log in.");
                navigate('/login'); // Send them to login with their new admin account
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 font-sans p-4">
            <div className="w-full max-w-lg p-8 bg-white border shadow-xl border-slate-100 rounded-3xl">
                
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="p-3 bg-blue-50 rounded-2xl mb-3">
                        <Building className="w-10 h-10 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">Register Your Organization</h2>
                    <p className="text-slate-500 text-sm mt-1">Create your isolated admin workspace</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Organization Name */}
                    <div>
                        <label className="block mb-1 text-xs font-bold text-slate-500 uppercase">Company / Organization Name *</label>
                        <div className="relative">
                            <Building className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input type="text" name="organizationName" required value={formData.organizationName} onChange={handleChange}
                                className="w-full py-2.5 pl-10 pr-4 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., SpaceX" />
                        </div>
                    </div>

                    {/* Admin Name */}
                    <div>
                        <label className="block mb-1 text-xs font-bold text-slate-500 uppercase">Your Name (Admin) *</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input type="text" name="name" required value={formData.name} onChange={handleChange}
                                className="w-full py-2.5 pl-10 pr-4 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Elon Musk" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Email */}
                        <div>
                            <label className="block mb-1 text-xs font-bold text-slate-500 uppercase">Email *</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <input type="email" name="email" required value={formData.email} onChange={handleChange}
                                    className="w-full py-2.5 pl-10 pr-4 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="admin@company.com" />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block mb-1 text-xs font-bold text-slate-500 uppercase">Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                    className="w-full py-2.5 pl-10 pr-4 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+1 234 567 890" />
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block mb-1 text-xs font-bold text-slate-500 uppercase">Password *</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input type="password" name="password" required minLength="6" value={formData.password} onChange={handleChange}
                                className="w-full py-2.5 pl-10 pr-4 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Min. 6 characters" />
                        </div>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full py-3 mt-4 text-white font-bold bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-500/30">
                        {isSubmitting ? 'Creating Workspace...' : 'Create Organization Workspace'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterOrg;