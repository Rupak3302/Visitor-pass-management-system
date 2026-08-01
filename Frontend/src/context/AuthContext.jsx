import { createContext, useState, useEffect } from "react";
import { loginUser} from "../services/usersApi";
import toast from "react-hot-toast"; // This is the popup notification tool

// create the context
export const AuthContext = createContext();

// create the provider 
export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // This check if they are already looged in when the app is loads
    useEffect(() => {
        // Check browser's memory for a saved user 
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
        }

        setLoading(false);
    }, []);

    // The Global LOGIN Function
    const login = async (credentials) => {
        try {

            // call perfectly refactored service API
            const data = await loginUser(credentials);

            // save the user and token details to the local storage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // update the react state so the app knows we are logged in
            setUser(data.user);

            toast.success(`Welcome back ${data.user.name}!`);
            return { success: true }; 

            } catch (error) {
                console.error('Login error:', error);
                const message = error.response?.data?.message || 'Login Failed';
                toast.error(message);
                return { success: false, message };
            }
//             // send the email and pass to our backend node.js
//             const res = await api.post('/user/login', { email, password });
//             // create a perfect user object
//             const loggedInUser = {
//                 ...res.data.user,   // name, email,  etc
//                 token: res.data.token   // add the token
//             }
//             // If successfull, then save the returned data (name, role, token)
//             setUser(loggedInUser);
//             localStorage.setItem('user', JSON.stringify(loggedInUser));
//             // also save it to the browser memory if refresh the page then still logged in
//             toast.success(`Welcome back ${loggedInUser.name}!`);
//             return true;  
//         } catch (error) {
//             toast.error(error.response?.data?.message || 'Login Failed'); // red popup for an error
//             return false;
//         }
    };
    

//     // The Global LOGOUT Function
    const logout = () => {
        localStorage.removeItem('user'); // Erase the browser's memory
        localStorage.removeItem('token');
        setUser(null); // clear the react state
        toast.success('Logged out successfully');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
