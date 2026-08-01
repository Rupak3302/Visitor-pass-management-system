const Appointment = require('../models/appointmentModels');
const Pass = require('../models/passModels');
const Visitor = require('../models/visitorModels');
const CheckLog = require('../models/checkLogsModels');

exports.getAdminDashboardStats = async (req, res) => {
    try {
        // Multi-Tenant isolation: Define the organization filter once
        const orgFilter = { organizationName: req.user.organizationName };

        // 1. QUICK GLANCE STATS
        const totalVisitors = await Visitor.countDocuments(orgFilter);
        const totalAppointments = await Appointment.countDocuments(orgFilter);
        const totalPasses = await Pass.countDocuments(orgFilter);
        const currentlyInside = await CheckLog.countDocuments({ ...orgFilter, status: 'Inside', checkOutTime: null });

        // 2. PASS STATUS DONUT CHART DATA
        const passes = await Pass.find(orgFilter, 'status');
        const passStats = { active: 0, used: 0, expired: 0, cancelled: 0 };
        passes.forEach(p => {
            if (p.status === 'active') passStats.active++;
            else if (p.status === 'used' || p.status === 'inactive') passStats.used++;
            else if (p.status === 'expired') passStats.expired++;
            else if (p.status === 'cancelled') passStats.cancelled++;
        });

        const passChartData = [
            { name: 'Active', value: passStats.active, color: '#22c55e' }, // Green
            { name: 'Used', value: passStats.used, color: '#64748b' },     // Slate
            { name: 'Expired', value: passStats.expired, color: '#ef4444' }, // Red
            { name: 'Cancelled', value: passStats.cancelled, color: '#f59e0b' } // Amber
        ];

        // 3. TRAFFIC TREND (Last 7 Days)
        const trafficData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);

            const count = await Appointment.countDocuments({
                ...orgFilter,
                visitDate: { $gte: date, $lt: nextDate }
            });

            trafficData.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }), // e.g., "Mon"
                visitors: count
            });
        }

        // 4. RECENT ACTIVITY (Last 5 Appointments)
        const recentActivity = await Appointment.find(orgFilter)
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('visitorId', 'name company')
            .populate('hostId', 'name');

        res.status(200).json({
            success: true,
            stats: { totalVisitors, totalAppointments, totalPasses, currentlyInside },
            charts: { passChartData, trafficData },
            recentActivity
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: "Server error fetching dashboard stats" });
    }
};