const User = require ('../models/userModels'); // Import the User model
const bcrypt = require('bcryptjs'); // For hashing passwords
const jwt = require('jsonwebtoken'); // For generating JWT tokens 

const generateToken = (id, role) => {
    return jwt.sign({
        id,
        role 
    }, process.env.JWT_SECRET, // Secret key from .env
    {
        expiresIn: '30d' // Token expires in 30 days
    });
}

// POST /api/user/login
// Login a Registered User and returns a JWT token 
exports.loginUser = async (req, res) => {
    console.log('Login request received with body:', req.body); 
    try {
        const { email, password } = req.body;

        // Check if both fields are provided
        if (!email || !password) {
            return res.status(400).json({
                message: 'Please provide email and password'
            });
        }

        // Find the user by their email and I used .select('+password') because password has select: false in the user model (hidden by default)
        const existingUser = await User.findOne({ email }).select('+password');

        // Check if user exists and if the passwords match
        // bycrypt.compare automatically checks the typed pass against the hashed pass
        if (!existingUser || !(await bcrypt.compare(password, existingUser.password))) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Block Deactivated User from logging in
        if (existingUser && existingUser.isActive === false) {
            return res.status(403).json({
                message: 'Your account has been deactivated.' 
            });
        }
        
        // If All is good, send back a token and proceed this
        res.json({
            message: 'Login successful',
            token: generateToken(existingUser._id, existingUser.role), 
            user: {
                _id: existingUser._id,
                organizationName: existingUser.organizationName,
                name: existingUser.name,
                email: existingUser.email,
                role: existingUser.role,
            },
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({
            message: `Login error: ${error.message}`
        });
    }
};

// POST /api/user/register
// Register a new User
exports.registerUser = async (req, res) => {
    try {  
        const { name, email, password, role, phone, organizationName } = req.body;

        // Check field are not empty
        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email, and password fields are mandatory'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long'
            });
        }

        // Email formating (Regex)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Please enter a valid email address (e.g., user@gmail.com)'
            });
        }

        // check if user is already registered
        const userExists = await User.findOne({ email });
        
        if (userExists) {
            return res.status(400).json({ 
                message: 'User already exists with this email' 
            });
        }

        // Hash the password before saving to the database (for security purposes)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the user in the database
        const newUser = await User.create({
            organizationName: organizationName || 'Main Company', 
            name,
            email,
            password: hashedPassword, // save the hashed password
            role: role ||'host',
            phone: phone || '', // save the phone number or default to an empty string
        });

        // send back success response with a token
        res.status(201).json({
            message: 'Accounted created successfully',
            token: generateToken(newUser._id, newUser.role),
            user: {
                _id: newUser._id,
                organizationName: newUser.organizationName,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                phone: newUser.phone,
            },
        });
    
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({
            message: `Registration error: ${error.message}`
        });
    }
};

// GET /api/user/:id
// Get a single user by ID
exports.getUserById = async (req, res) => {
    try {
        const users = await User.findById(req.params.id);

        if (!users) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json({
            users: {
                _id: users._id,
                name: users.name,
                email: users.email,
                role: users.role,
                phone: users.phone,
                createdAt: users.createdAt,
            },
        });

    } catch (error) {
        console.error('Get user error:', error.message);
        res.status(500).json({
            message: `Server error: ${error.message}`
        });
    }
};

// ** For Admin Operations **

// Get all users (with search, role filter, and status )
// GET /api/users/admin/all
exports.getAllUsers = async (req, res) => {
    try {
        // MULTI-TINANT ISOLATION: Instantly lock the search to the Admin's specific organization!
        let filter = { organizationName: req.user.organizationName };

        // Role tab Filter (All, Admin, Host, Security)
        if (req.query.role && req.query.role !== 'All') {
            filter.role = req.query.role.toLowerCase();
        }

        // Text search Filter by (Name, email, phone)
        if (req.query.search && req.query.search.trim() !== "") {
            const searchRegex = new RegExp(req.query.search.trim(), 'i');
            filter.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { phone: searchRegex }
            ];
        }

        // Fetch matched uers ordered by newest joined first
        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });

        // Calculate cards counts
        const allSystemUsers = await User.find({ organizationName: req.user.organizationName });
        const total = allSystemUsers.length;
        const deactivated = allSystemUsers.filter(u => u.isActive === false).length;

        // For active counts, just set to 0
        const deleted = 0;

        res.status(200).json({
            success: true,
            stats: {
                total: total,
                deactivated: deactivated,
                deleted: deleted
            },
            count: users.length,
            users: users
        });

    } catch (error) {
        console.error('Admin get all users error:', error.message);
        res.status(500).json({
            sucess: false,
            message: `Server error: ${error.message}`
        });
    }
};

// Toggle user status (active/inactive)
// PATCH /api/users/admin/status/:id
exports.UpdateUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                sucess: false,
                message: 'User not found'
            });
        }

        // Prevent admin from deactivating themselvesaccidentally
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                sucess: false,
                message: 'You cannot deactivate yourself'
            });
        }

        // Toggle isActive field
        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({
            sucess: true,
            message: `User status updated successfully ${user.isActive ? 'activated' : 'deactivated'}`,
            user: {
                _id: user._id,
                name: user.name,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Toggle user status error:', error.message);
        res.status(500).json({
            sucess: false,
            message: `Server error: ${error.message}`
        });
    }
};

// Parmanently delete user
// DELETE /api/users/admin/:id
exports.deleteUser = async (req, res) => {
    try {

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                sucess: false,
                message: 'User profile not found'
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            sucess: true,
            message: 'User account has been permantently deleted from the system sucessfully'
        });
    } catch (error) {
        console.error('Delete user error:', error.message);
        res.status(500).json({
            sucess: false,
            message: `Server error: ${error.message}`
        })   
    }
};

