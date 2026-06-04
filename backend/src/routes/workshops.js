"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all workshops
router.get('/', async (req, res) => {
    try {
        const workshops = await prismaClient_1.default.workshop.findMany();
        res.json(workshops);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Create a new workshop
router.post('/', auth_1.authenticateToken, async (req, res) => {
    if (req.user?.role !== 'WORKSHOP_OWNER') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const { name, services, address, hours, description } = req.body;
        const workshop = await prismaClient_1.default.workshop.create({
            data: {
                name,
                services: JSON.stringify(services), // Storing array as string for sqlite simplicity
                address,
                hours,
                description,
                ownerId: req.user.id
            }
        });
        res.json(workshop);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Book an appointment
router.post('/:id/book', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { serviceType, time, carDetails, price } = req.body;
        const appointment = await prismaClient_1.default.appointment.create({
            data: {
                userId: req.user.id,
                workshopId: id,
                serviceType,
                time,
                carDetails,
                price
            }
        });
        res.json(appointment);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Get appointments for the authenticated user/owner
router.get('/appointments', auth_1.authenticateToken, async (req, res) => {
    try {
        const role = req.user.role;
        const userId = req.user.id;
        if (role === 'WORKSHOP_OWNER') {
            // Find all workshops owned by this owner
            const workshops = await prismaClient_1.default.workshop.findMany({
                where: { ownerId: userId }
            });
            const workshopIds = workshops.map(w => w.id);
            // Find all appointments for these workshops
            const appointments = await prismaClient_1.default.appointment.findMany({
                where: { workshopId: { in: workshopIds } },
                include: {
                    user: {
                        select: { name: true, email: true, phone: true }
                    },
                    workshop: {
                        select: { name: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(appointments);
        }
        else {
            // It's a standard user, fetch their booked appointments
            const appointments = await prismaClient_1.default.appointment.findMany({
                where: { userId },
                include: {
                    workshop: {
                        select: { name: true, specialty: true, priceEstimate: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(appointments);
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Update appointment status
router.patch('/appointments/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const appointment = await prismaClient_1.default.appointment.findUnique({
            where: { id }
        });
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        const userId = req.user.id;
        const role = req.user.role;
        if (role === 'WORKSHOP_OWNER') {
            const workshop = await prismaClient_1.default.workshop.findFirst({
                where: { id: appointment.workshopId, ownerId: userId }
            });
            if (!workshop) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
        }
        else {
            if (appointment.userId !== userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
        }
        const updated = await prismaClient_1.default.appointment.update({
            where: { id },
            data: { status }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
