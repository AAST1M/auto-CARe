"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Middleware to authorize admin only
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    next();
};
// Get platform stats
router.get('/stats', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        // 1. Count users by role
        const users = await prismaClient_1.default.user.findMany({
            select: { role: true }
        });
        const roleCounts = {
            USER: 0,
            WINCH_DRIVER: 0,
            WORKSHOP_OWNER: 0,
            ADMIN: 0
        };
        users.forEach(u => {
            if (u.role in roleCounts) {
                roleCounts[u.role]++;
            }
        });
        // 2. Count workshops
        const workshopCount = await prismaClient_1.default.workshop.count();
        // 3. Workshop Appointments stats
        const appointments = await prismaClient_1.default.appointment.findMany({
            where: {
                status: { in: ['Completed', 'Confirmed', 'Checked-In'] }
            },
            select: { price: true, status: true }
        });
        const activeApptCount = await prismaClient_1.default.appointment.count({
            where: {
                status: { in: ['Pending', 'Confirmed', 'Checked-In'] }
            }
        });
        // 4. Winch Bookings stats
        const winchBookings = await prismaClient_1.default.winchBooking.findMany({
            where: { status: 'Completed' },
            select: { price: true }
        });
        // Calculations
        const workshopRevenue = appointments.reduce((sum, item) => sum + item.price, 0);
        const winchRevenue = winchBookings.reduce((sum, item) => sum + item.price, 0);
        const totalRevenue = workshopRevenue + winchRevenue;
        // 10% platform commission
        const totalCommission = totalRevenue * 0.1;
        res.json({
            users: roleCounts,
            workshops: workshopCount,
            revenue: totalRevenue,
            commission: totalCommission,
            activeAppointments: activeApptCount,
            completedAppointments: appointments.filter(a => a.status === 'Completed').length,
            completedWinchBookings: winchBookings.length,
            systemHealth: 'OK'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});
// Get all transactions
router.get('/transactions', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Fetch all users to map names/emails
        const allUsers = await prismaClient_1.default.user.findMany({
            select: { id: true, name: true, email: true }
        });
        const userMap = new Map(allUsers.map(u => [u.id, u.name || u.email]));
        // Fetch workshop appointments
        const appointments = await prismaClient_1.default.appointment.findMany({
            include: {
                workshop: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // Fetch winch bookings
        const winchBookings = await prismaClient_1.default.winchBooking.findMany({
            orderBy: { createdAt: 'desc' }
        });
        // Format workshop transactions
        const formattedAppts = appointments.map(appt => ({
            id: appt.id,
            type: 'Workshop Booking',
            date: appt.createdAt,
            customerName: userMap.get(appt.userId) || 'Unknown User',
            providerName: appt.workshop.name,
            amount: appt.price,
            commission: appt.price * 0.1,
            status: appt.status
        }));
        // Format winch transactions
        const formattedWinch = winchBookings.map(wb => ({
            id: wb.id,
            type: 'Winch Ride',
            date: wb.createdAt,
            customerName: userMap.get(wb.userId) || 'Unknown User',
            providerName: wb.driverName,
            amount: wb.price,
            commission: wb.price * 0.1,
            status: wb.status
        }));
        // Combine and sort by date descending
        const allTransactions = [...formattedAppts, ...formattedWinch].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        res.json(allTransactions);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});
// Get all users
router.get('/users', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await prismaClient_1.default.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                walletBalance: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
