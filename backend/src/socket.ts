import { Server, Socket } from 'socket.io';
import prisma from './prismaClient';

// Track online drivers: socketId -> driver info
const onlineDrivers = new Map<string, any>();
// Track socketId by userId
const userSockets = new Map<string, string>();

export function setupSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('⚡ Client connected:', socket.id);

    // Register user's socket
    socket.on('register_user', (userId: string) => {
      userSockets.set(userId, socket.id);
    });

    // ── Driver goes ONLINE ────────────────────────────────────────────────────
    socket.on('driver_online', (data: { driverId: string; driverName: string; vehicle: string; price: number }) => {
      onlineDrivers.set(socket.id, { ...data, socketId: socket.id });
      io.emit('drivers_updated', Array.from(onlineDrivers.values()));
      console.log(`✅ Driver ${data.driverName} is ONLINE`);
    });

    // ── Driver goes OFFLINE ───────────────────────────────────────────────────
    socket.on('driver_offline', () => {
      onlineDrivers.delete(socket.id);
      io.emit('drivers_updated', Array.from(onlineDrivers.values()));
    });

    // ── Get current online drivers (on demand) ────────────────────────────────
    socket.on('get_drivers', () => {
      socket.emit('drivers_updated', Array.from(onlineDrivers.values()));
    });

    // ── Customer REQUESTS a driver ─────────────────────────────────────────────
    socket.on('request_driver', (data: {
      customerId: string;
      customerName: string;
      driverSocketId: string;
      car: string;
      issue: string;
      price: number;
    }) => {
      const driverSocket = io.sockets.sockets.get(data.driverSocketId);
      if (driverSocket) {
        driverSocket.emit('new_request', {
          customerId: data.customerId,
          customerName: data.customerName,
          customerSocketId: socket.id,
          car: data.car,
          issue: data.issue,
          price: data.price,
          distance: '2.4 km',
        });
        console.log(`📞 Customer ${data.customerName} requested driver ${data.driverSocketId}`);
      } else {
        socket.emit('driver_unavailable', { message: 'Driver is no longer available. Please choose another.' });
      }
    });

    // ── Driver ACCEPTS ─────────────────────────────────────────────────────────
    socket.on('accept_request', async (data: {
      customerSocketId: string;
      customerId: string;
      driverId: string;
      driverName: string;
      vehicle: string;
      price: number;
    }) => {
      onlineDrivers.delete(socket.id);
      io.emit('drivers_updated', Array.from(onlineDrivers.values()));

      try {
        const booking = await prisma.winchBooking.create({
          data: {
            userId: data.customerId,
            driverId: data.driverId,
            driverName: data.driverName,
            vehicle: data.vehicle,
            price: data.price,
            status: 'Active',
          }
        });

        const bookingId = booking.id;
        socket.join(`winch_${bookingId}`);

        const customerSocket = io.sockets.sockets.get(data.customerSocketId);
        if (customerSocket) {
          customerSocket.join(`winch_${bookingId}`);
          customerSocket.emit('booking_confirmed', {
            bookingId,
            driverName: data.driverName,
            vehicle: data.vehicle,
            price: data.price,
          });
        }

        socket.emit('booking_started', { bookingId, customerId: data.customerId });
        console.log(`🚗 Booking ${bookingId} created`);
      } catch (err) {
        console.error('Booking creation error:', err);
        socket.emit('booking_error', { message: 'Could not create booking.' });
      }
    });

    // ── Driver DECLINES ────────────────────────────────────────────────────────
    socket.on('decline_request', (data: { customerSocketId: string }) => {
      const customerSocket = io.sockets.sockets.get(data.customerSocketId);
      if (customerSocket) {
        customerSocket.emit('request_declined', { message: 'Driver declined your request. Please choose another driver.' });
      }
    });

    // ── Join booking room ──────────────────────────────────────────────────────
    socket.on('join_winch_room', (bookingId: string) => {
      socket.join(`winch_${bookingId}`);
    });

    // ── Real-time location ─────────────────────────────────────────────────────
    socket.on('update_location', async (data: {
      bookingId: string;
      driverLat?: number;
      driverLng?: number;
      userLat?: number;
      userLng?: number;
      status?: string;
    }) => {
      io.to(`winch_${data.bookingId}`).emit('location_updated', data);

      try {
        const updateData: any = {};
        if (data.driverLat) updateData.driverLat = data.driverLat;
        if (data.driverLng) updateData.driverLng = data.driverLng;
        if (data.userLat) updateData.userLat = data.userLat;
        if (data.userLng) updateData.userLng = data.userLng;

        if (Object.keys(updateData).length > 0) {
          await prisma.winchBooking.update({ where: { id: data.bookingId }, data: updateData });
        }
      } catch (err) {
        console.error('Location update error:', err);
      }
    });

    socket.on('disconnect', () => {
      if (onlineDrivers.has(socket.id)) {
        onlineDrivers.delete(socket.id);
        io.emit('drivers_updated', Array.from(onlineDrivers.values()));
      }
      for (const [userId, sid] of userSockets.entries()) {
        if (sid === socket.id) userSockets.delete(userId);
      }
      console.log('Client disconnected:', socket.id);
    });
  });
}
