# Visitor Pass Management System (MERN Stack)

## Objective
A full-stack web application to digitize the visitor management process, enabling pre-registration, QR-code passes, and secure check-in/check-out. Built for Tutedude Assignment.

## Tech Stack
* **Frontend:** React.js, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Database:** MongoDB

---

## Project Setup & Progress Log

### ✅ Phase 1: Backend Initialization (Completed)
* Set up the Node.js/Express workspace.
* Installed core dependencies (`express`, `mongoose`, `cors`, `dotenv`).
* Configured MongoDB connection via Mongoose.
* Created initial `.env` configuration.
* Server successfully running and connected to the database.

### ✅ Phase 2: Database Models (Users & Visitors)
* Separated database connection logic into `config/db.js` for cleaner architecture.
* Created Mongoose schema for `User` with Role-Based access control (Admin, Security, Host).
* Utilized Mongoose `timestamps` to automatically track creation and update times.

### ✅ Phase 3: User Authentication Setup
* Installed `bcryptjs` for secure password hashing and `jsonwebtoken` for stateless authentication.
* Created `authController.js` with `registerUser` and `loginUser` logic.
* Configured `authRoutes.js` to handle `/api/auth/register` and `/api/auth/login` endpoints.
* Connected auth routes to the main `server.js` entry point.
* Implemented `authMiddleware.js` to protect private routes using JWT verification.
* Implemented `authorizeRoles` middleware for Role-Based Access Control (RBAC), ensuring strict separation of Admin, Security, and Host privileges.

### ✅ Phase 4: Relational Database Models
* Created Mongoose schema for `Visitor` to track external guests.
* Created `Appointment` model linking `Visitor` and `User` (Host).
* Created `Pass` model to store QR code data and validity status.
* Created `CheckLog` model to track exact entry/exit timestamps and auditing (scannedBy).
* Implemented MongoDB `ObjectId` references (`ref`) to establish relational data structures between collections.
* Built `visitorController.js` to handle Visitor registration and retrieval.
* Configured public `POST` route for visitor pre-registration.
* Applied `protect` and `authorizeRoles` middleware to the `GET` route so only authorized staff (Admin, Security, Host) can view the visitor database.

### ✅ Phase 5: Appointment & Scheduling System
* Built `appointmentController.js` to handle visit scheduling.
* Implemented Mongoose `.populate()` to seamlessly join Visitor and Host data within queries.
* Built dynamic, role-based database querying (Hosts only see their own invites, Admins see all).
* Added `PUT` route for updating appointment status (Approve/Reject).

### ✅ Phase 6: Automated QR Pass Generation
* Installed `qrcode` library for server-side image generation.
* Intercepted the `updateAppointmentStatus` controller to trigger automated workflows.
* Configured logic to automatically generate a secure Base64 QR code and a `Pass` document in MongoDB the moment an appointment is approved.

### ✅ Phase 7: Security CheckLog System
* Built `checkLogController.js` to process scanned QR code data.
* Implemented automatic Check-In / Check-Out toggling based on active entry state.
* Added pass expiration validation (`validUntil` check) to prevent unauthorized entry.
* Secured the `/scan` endpoint explicitly for `Security` and `Admin` roles.