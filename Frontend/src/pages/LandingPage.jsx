import { Link } from 'react-router-dom'; // for this changes the URL without refreshing
// for this I get the pre-made SVG icons from the 'lucide-react' library
import  { Shield, QrCode, Clock, ArrowRight } from 'lucide-react';

const LandingPage = () => {

    return (
        <div className='min-h-screen bg-slate-50 font-sans'>

            {/* Navbar Section */}
            <nav className='flex items-center justify-between px-8 py-4 bg-white shadow-sm'>

                {/* Logo Area*/}
                <div className='flex items-center gap-2'>
                    <Shield className='w-8 h-8 text-blue-600'/>
                    <span className='text-xl font-bold text-slate-800'>SecurePass</span>
                </div>

                {/* Navigation link area */}
                <div className='flex gap-4 items-center'>

                    {/* NEW: Company Sign Up */}
                    <Link to="/register-org" className='text-sm font-bold text-slate-500 hover:text-blue-600 transition'>
                        Register Company
                    </Link>

                    <div className="w-px h-6 bg-slate-200 mx-2"></div>

                    <Link to="/register-visitor" className='px-5 py-2 text-sm font-bold text-blue-500 border border-blue-500 rounded-xl hover:bg-blue-200 transition shadow-md'>
                        Pre-Register Visitor
                    </Link>
                    {/* This button will take the users login page*/}
                    <Link to="/login" className='px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-md'>
                        Owner Login
                    </Link>
                </div>

            </nav>

            {/* Hero Section */}
            <main className='max-w-6xl px-8 mx-auto mt-20 text-center'>

                <h1 className='text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mb-6'>
                    Modern Visitor Pass management System <br />
                    <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'>
                        For Secure Facilities.
                    </span>
                </h1>

                <p className='max-w-2xl mx-auto text-lg text-slate-600 mb-10'>
                    Streamline your check-in process, enhance security, and provide a seamless experience for your guests.
                </p>

            </main>

        </div>
    )
};

export default LandingPage;


