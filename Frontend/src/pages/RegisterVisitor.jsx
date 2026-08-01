import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, User, Mail, Phone, Building, Calendar, Briefcase, Clock, ArrowLeft, Info, AlertTriangle, Camera } from "lucide-react";
import toast from 'react-hot-toast'

import api from '../services/api'

const RegisterVisitor = () => {
    const navigate = useNavigate();
    const [ photo, setPhoto ] = useState(null);
    const [ photoPreview, setPhotoPreview ] = useState('');
    const [ organizations, setOrganizations ] = useState([]);
    const [ hosts, setHosts ] = useState([]);
    const [ isSubmitting, setIsSubmitting ] = useState(false);
    // I creating 6 different useStates, because group all form data into one object! Instead od useState
    const [ formData, setFormData ] = useState({
        organizationName: '',
        name: '',
        email: '',
        phone: '',
        purpose: '',
        company: '',
        hostId: '',
        visitDate: '',
        visitTime: '',
        notes: '',
    });

    // helper array for generate hours and minutes dropdowns
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    // state the custom 12 hour time picker 
    const [ preferredTime, setPreferredTime ] = useState({ hour: '', minute: '', ampm: '' });

    // ON LOAD: Fetch all organizations
    useEffect(() => {
        api.get('/visitors/organizations')
        .then(res => setOrganizations(res.data.organizations || []))
        .catch(err => {
            console.error(err);
            toast.error('Failed to load organizations');
        });
    }, []);

    // CASCADING EFFECT: Fetch hosts ONLY when an organization is selected!
    useEffect(() => {
        if (!formData.organizationName) {
            setHosts([]); // Clear hosts if no org selected
            setFormData(prev => ({ ...prev, hostId: '' })); // Reset host selection
            return;
        }

        // Fetch hosts belonging to the selected organization
        api.get(`/visitors/hosts?organizationName=${encodeURIComponent(formData.organizationName)}`)
        .then(res => {
            if (Array.isArray(res.data)) setHosts(res.data);
            else if (res.data && Array.isArray(res.data.hosts)) setHosts(res.data.hosts);
            else setHosts([]);
        })
        .catch(err => {
            console.error(err);
            toast.error('Failed to load hosts for this organization');
            setHosts([]);
        });

    }, [ formData.organizationName ]);

    // Function to handle Preferred Time changes and convert to 24-hour
    const handlePreferredTimeChange = (field, value) => {
        const updatedTime = { ...preferredTime, [field]: value };
        setPreferredTime(updatedTime);

        if (updatedTime.hour && updatedTime.minute && updatedTime.ampm) {
            // // convert the time to 24-hour format
            // let hr = parseInt(updatedTime.hour);
            // if (updatedTime.ampm === "PM" && hr !== 12) {
            // hr += 12;
            // } else if (updatedTime.ampm === "AM" && hr === 12) {
            // hr = 0;
            // }

            // const formattedHour = hr.toString().padStart(2, "0");
            const finalTimestr = `${updatedTime.hour}:${updatedTime.minute} ${updatedTime.ampm}`;

            // save the time to the form
            setFormData(prev => ({ ...prev, visitTime: finalTimestr }));
        }
    }
    // This is the function that updates the formData state when user types in the form
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // This is the function that updates the photo state when user selects a photo
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPhoto(file);
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result);
        reader.readAsDataURL(file);
    };

    // this is the submit function
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Create the envelope
            const data = new FormData();

            // put the text and the photo inside the envelope
            Object.keys(formData).forEach((key) => {
                data.append(key, formData[key]);
            });

            // put the photo inside the envelope
            if (photo) {
                data.append('photo', photo);
            }

            // change the header format to data from formData
            const res = await api.post('/visitors', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });


            // if backend sends success, show green popup
            toast.success(res.data.message || 'Registration submitted successfully! Waiting for approval.');
            navigate('/');

        } catch (error) {
            // if backend sends error, show red popup
            toast.error(error.response?.data?.message || 'Registration failed!');

        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen text-slate-800 bg-slate-100 py-10 px-4 font-sans">
        <div className="max-w-6xl mx-auto">

                {/* Back Button */}
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
                
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                <div className="bg-blue-100 p-2 rounded-lg">
                    <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Visitor Pre-Registration</h1>
                    <p className="text-slate-500 text-sm">Fill in your details to schedule a visit</p>
                </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: THE FORM */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 space-y-8 shadow-sm">
                    
                    {/* Section 1: Personal Information */}
                    <div>
                        <h2 className="text-slate-800 font-bold mb-4 border-b border-slate-200 pb-2">Personal Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-800 uppercase mb-2">Full Name *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-5 h-6 text-slate-500" />
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} required
                                    className="w-full border border-slate-200 rounded-lg px-4 py-3 pl-10 text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="John Doe"/>
                                </div>
                            </div>
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-800 uppercase mb-2">Email *</label>
                                <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-6 text-slate-500" />
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                                    className="w-full border border-slate-200 rounded-lg px-4 py-3 pl-10 text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="john.doe@example.com"/>
                                </div>
                            </div>
                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-800 uppercase mb-2">Phone *</label>
                                <div className="relative">
                                <Phone className="absolute left-3 top-3 w-5 h-6 text-slate-500" />
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                                    className="w-full border border-slate-200 rounded-lg px-4 py-3 pl-10 text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="+1 (555) 000-0000"/>
                                </div>
                            </div>
                            {/* Company */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-800 uppercase mb-2">Company </label>
                                <div className="relative">
                                <Building className="absolute left-3 top-3 w-5 h-6 text-slate-500" />
                                <input type="text" name="company" value={formData.company} onChange={handleChange}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-3 pl-10 text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Company Name"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Visit Details */}
                    <div>
                        <h2 className="text-slate-900 font-bold mb-4 border-b border-slate-300 pb-2">Visit Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Organization Selection */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-800 uppercase mb-2">Destination Organization *</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-3 w-5 h-6 text-slate-500" />
                                    <select name="organizationName" value={formData.organizationName} onChange={handleChange} required
                                        className="w-full border border-slate-200 rounded-lg px-4 py-3 pl-10 text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition">
                                        <option value="">Select the company you are visiting...</option>
                                        {organizations.map((org, index) => (
                                            <option key={index} value={org}>{org}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {/* Purpose Selection */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-800 uppercase mb-2">Purpose *</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-3 w-5 h-6 text-slate-500" />
                                    <select name="purpose" value={formData.purpose} onChange={handleChange} required
                                        className="w-full border border-slate-200 rounded-lg px-4 py-3 pl-10 text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition">
                                        <option value="">Select purpose...</option>
                                        <option value="Meeting">Meeting</option>
                                        <option value="Interview">Interview</option>
                                        <option value="Delivery">Delivery</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Personal">Personal</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            {/* Host User Selection */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-800 uppercase mb-2">Who will you meet? *</label>
                                <select 
                                    name="hostId" 
                                    value={formData.hostId} 
                                    onChange={handleChange} 
                                    required
                                    disabled={!formData.organizationName} // Disable if no organization selected
                                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                    <option value="">{formData.organizationName ? "Select who you're visiting..." : "Select an organization first..."}</option>
                                    {hosts.map(host => (
                                        <option key={host._id} value={host._id}>{host.name}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Preffered Visit Date */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-800 uppercase mb-2">Visit Date *</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 w-5 h-6 text-slate-500" />
                                    <input type="date" name="visitDate" value={formData.visitDate} onChange={handleChange} required
                                    className="w-full border border-slate-200 rounded-lg px-4 py-3 pl-10 text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                </div> 
                            </div>
                            {/* Preferred visit Time */}
                            <div className="relative">
                                <label className="block text-xs font-semibold text-slate-800 uppercase mb-2">Preferred Time *</label>
                                <div className="flex items-center gap-2">
                                    {/* Hour */}
                                    {/* <Clock className="absolute left-3 top-3 w-5 h-6 text-slate-500" /> */}
                                    {/* <input type="time" name="visitTime" value={formData.visitTime} onChange={handleChange} required
                                    className="w-full border border-slate-200 rounded-lg px-4 py-3 pl-10 text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" /> */}
                                    <select 
                                        value={preferredTime.hour}
                                        onChange={(e) => handlePreferredTimeChange('hour', e.target.value)}
                                        className="w-full px-3 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-slate-700 font-semibold bg-white text-center appearance-none cursor-pointer transition-all"
                                    >
                                        <option value="" disabled>--</option>
                                        {hours.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>

                                    <span className="text-slate-400 font-bold">:</span>
                                     {/* Minute  */}
                                    <select
                                        value={preferredTime.minute}
                                        onChange={(e) => handlePreferredTimeChange('minute', e.target.value)}
                                        className="w-full px-3 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-slate-700 font-semibold bg-white text-center appearance-none cursor-pointer transition-all"
                                    >
                                        <option value="" disabled>--</option>
                                        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    {/* AM/PM */}
                                    <select
                                        value={preferredTime.ampm}
                                        onChange={(e) => handlePreferredTimeChange('ampm', e.target.value)}
                                        className="w-full px-3 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-slate-700 bg-white font-semibold text-center appearance-none cursor-pointer transition-all"
                                    >
                                        <option value="" disabled>--</option>
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-800 uppercase mb-2">Notes</label>
                                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" placeholder="Anything you want to say here..."
                                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Photo Upload */}
                    <div>
                        <h2 className="text-white font-bold mb-4 border-b border-slate-300 pb-2">Your Photo (Required) *</h2>
                        <div className="relative border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-100/50 transition flex flex-col items-center justify-center p-8 overflow-hidden group">
                        <input type="file" name="photo" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        
                        {photoPreview ? (
                            <img src={photoPreview} alt="Preview" className="h-32 w-32 object-cover rounded-full mb-2" />
                        ) : (
                            <Camera className="w-10 h-10 text-slate-500 mb-3 group-hover:text-blue-500 transition" />
                        )}
                        
                        <p className="text-sm font-medium text-slate-500 group-hover:text-slate-300 transition">
                            {photo ? photo.name : "Click to upload photo (max 5MB)"}
                        </p>
                        </div>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition disabled:opacity-70 mt-4">
                        {isSubmitting ? "Submitting Request..." : "Submit Registration"}
                    </button>
                    </form>
                </div>

                {/* RIGHT COLUMN: INFO CARDS */}
                <div className="space-y-6">
                    
                        {/* Guide Card */}
                        <div className=" border border-blue-600 rounded-2xl p-6 shadow-lg">
                            <h3 className=" font-bold flex items-center gap-2 mb-4">
                                <Info className="w-5 h-5 text-blue-600"/> What happens next?
                            </h3>
                            <ul className="space-y-4 text-sm text-slate-600">
                                <li className="flex gap-3"><span className="text-blue-600 font-mono font-bold">01</span> Request is sent to host employee</li>
                                <li className="flex gap-3"><span className="text-blue-600 font-mono font-bold">02</span> Host approves or reschedules</li>
                                <li className="flex gap-3"><span className="text-blue-600 font-mono font-bold">03</span> You receive email with QR pass</li>
                                <li className="flex gap-3"><span className="text-blue-600 font-mono font-bold">04</span> Show QR at reception to check in</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterVisitor;