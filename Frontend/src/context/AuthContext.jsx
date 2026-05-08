import { createContext, useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast"; // This is the popup notification tool

// create the context
export const AuthContext = createContext();

// create the provider 
export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // This check if they are already looged in
    useEffect(() => {
        // Check browser's memory for a saved user 
        const storedUser = localStorage.getItem('user');

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        setLoading(false);
    }, []);

    // LOGIN Function:
    const login = async (email, password) => {
        try {
            // send the email and pass to our backend node.js
            const res = await api.post('/user/login', { email, password });

            // create a perfect user object
            const loggedInUser = {
                ...res.data.user,   // name, email,  etc
                token: res.data.token   // add the token
            }

            // If successfull, then save the returned data (name, role, token)
            setUser(loggedInUser);
            localStorage.setItem('user', JSON.stringify(loggedInUser));

            // also save it to the browser memory if refresh the page then still logged in
            toast.success(`Welcome back ${loggedInUser.name}!`);
            return true;  

        
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login Failed'); // red popup for an error
            return false;
        }
    };
    

    // LOGOUT Function
    const logout = () => {
        setUser(null); // clear the react state
        localStorage.removeItem('user'); // Erase the browser's memory
        toast.success('Logged out successfully');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
