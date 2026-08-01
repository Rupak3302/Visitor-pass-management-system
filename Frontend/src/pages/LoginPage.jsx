import { useState, useContext } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
// useNavigate: A tool to programmatically change the page (e.g., redirect to dashboard after login)
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from '../context/AuthContext.jsx';
import { Shield, ArrowLeft, Mail, Lock, LogIn, EyeOff, Eye } from "lucide-react";

const LoginPage = () => {
    const { login } = useAuth(); // Grab the global login function
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [ isSubmitting, setIsSubmitting ] = useState(false); // Controls the loading spinner

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); // turn on the loading state

        console.log('Submitting login with:', { email, password });

        // call the backend API using our context function
        const result = await login({email, password});

        // If backend say all correct , then send them to the dashboard
        if (result.success) {
            navigate('/dashboard');
        }

        setIsSubmitting(false); // turn off the loading state, If fails

    };

    return (
        <div className='flex items-center justify-center min-h-screen bg-slate-50 font-sans'>
            <div className='w-full max-w-md p-8 bg-white border shadow-xl border-slate-100 rounded-3xl'>

                {/* Back Button */}
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <div className='flex flax-col items-center align-center pl-10 mb-8 text-center'>
                    <Shield className='w-12 h-12 text-blue-600 mb-2' />
                    <h2 className='text-2xl font-bold text-slate-800>'>Owner Portal Access</h2>
                </div>
                {/* From */}
                <form onSubmit={handleSubmit} className='space-y-6'>
                    {/* Email Input */}
                    <div>
                        <label className='block mb-2 text-sm font-medium text-slate-700'> Email</label>
                        <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className='w-full py-3 px-4 transition border rounded-xl border-slate-200'
                        placeholder="admin@test.com"
                        autoComplete="email"
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className='block mb-2 text-sm font-medium text-slate-700'>Password</label>
                        <div className='relative'>
                            <input 
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className='w-full py-3 pl-4 pr-12 transition border rounded-xl border-slate-200'
                            placeholder="Password"
                            autoComplete="current-password"
                            />

                            {/* add the show password button at the right side */}
                            <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className='absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 transition'
                            >
                                {/* Swap the icon based on the state of EyeOff */}  
                                {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                    type="submit"
                    disabled={isSubmitting} // disable when buttom are in loading
                    className='w-full py-3 text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition'>
                        {isSubmitting ? 'Verifying...' : 'Login'}
                    </button>
                </form>
            </div>

        </div>
    )
    
};

export default LoginPage;