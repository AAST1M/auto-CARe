"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get available winch offers
router.get('/offers', async (req, res) => {
    try {
        const offers = await prismaClient_1.default.winchOffer.findMany();
        res.json(offers);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Create a winch offer (driver)
router.post('/offers', auth_1.authenticateToken, async (req, res) => {
    if (req.user?.role !== 'WINCH_DRIVER') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const { driverName, price, eta, vehicle } = req.body;
        const offer = await prismaClient_1.default.winchOffer.create({
            data: {
                driverName,
                price,
                eta,
                vehicle
            }
        });
        res.json(offer);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Create a winch booking (when user accepts offer)
router.post('/bookings', auth_1.authenticateToken, async (req, res) => {
    try {
        const { driverName, price, vehicle } = req.body;
        const booking = await prismaClient_1.default.winchBooking.create({
            data: {
                userId: req.user.id,
                driverName,
                price: parseFloat(price),
                vehicle,
                status: 'Completed'
            }
        });
        res.json(booking);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
