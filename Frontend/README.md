# Visitor Pass Management System - Frontend 🚀

This is the React.js frontend for the Visitor Pass Management System. It is designed with a modern, responsive UI using Tailwind CSS and connects to a secure Node.js/Express backend API.

## 🛠️ Tech Stack
* **Framework:** React.js (Initialized via Vite for lightning-fast performance)
* **Styling:** Tailwind CSS (v3)
* **Routing:** React Router v7
* **State Management:** React Context API (AuthContext)
* **API Calls:** Axios (with automated JWT token interception)
* **Icons & UI:** Lucide-React & React-Hot-Toast

## 📂 Folder Structure Explanation
To keep the codebase clean and scalable, the architecture is divided into the following directories inside `/src`:
* `/components`: Reusable UI pieces (Buttons, Modals, Navbar, specific tables).
* `/context`: Global state managers (like `AuthContext.jsx` for managing logged-in users).
* `/pages`: Full screen views (LandingPage, LoginPage, Dashboards).
* `/utils`: Helper functions and API configurations (like the Axios instance).

## 🚀 How to Run Locally

1. **Install Dependencies:**
   Open a terminal in the `/Frontend` directory and run:
   ```bash
   npm install