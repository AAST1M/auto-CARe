import { Server, Socket } from 'socket.io';
import prisma from './prismaClient';
import { getAdminStats, getAdminTransactions, getAdminUsers } from './services/adminService';

// Track online drivers: socketId -> driver info
const onlineDrivers = new Map<string, any>();
// Track socketId by userId
const userSockets = new Map<string, string>();

export function getOnlineUserIds(): string[] {
  return Array.from(userSockets.keys());
}

export function getOnlineUsersCount(): number {
  return new Set(userSockets.keys()).size;
}
// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function setupSocket(io: Server) {
  // Setup real-time background broadcaster for admin dashboard
  setInterval(async () => {
    try {
      const adminRoom = io.sockets.adapter.rooms.get('admin_room');
      if (adminRoom && adminRoom.size > 0) {
        const stats = await getAdminStats();
        const transactions = await getAdminTransactions();
        const users = await getAdminUsers();
        io.to('admin_room').emit('admin_dashboard_update', { stats, transactions, users });
      }
    } catch (err) {
      console.error('Error broadcasting admin stats:', err);
    }
  }, 5000);

  io.on('connection', (socket: Socket) => {
    console.log('⚡ Client connected:', socket.id);

    // Join Admin Room
    socket.on('join_admin_room', () => {
      socket.join('admin_room');
      console.log(`🛡️ Admin joined dashboard room: ${socket.id}`);
    });

    socket.on('leave_admin_room', () => {
      socket.leave('admin_room');
    });

    // ── Workshop owner joins their workshop room ───────────────────────────────
    socket.on('join_workshop_room', (workshopId: string) => {
      if (workshopId) {
        socket.join(`workshop_${workshopId}`);
        console.log(`🔧 Workshop owner joined room: workshop_${workshopId}`);
      }
    });

    socket.on('leave_workshop_room', (workshopId: string) => {
      if (workshopId) socket.leave(`workshop_${workshopId}`);
    });

    // Register user's socket
    socket.on('register_user', (userId: string) => {
      userSockets.set(userId, socket.id);
    });

    // ── Driver goes ONLINE ────────────────────────────────────────────────────
    socket.on('driver_online', async (data: { driverId: string; driverName: string; vehicle: string; price: number, lat?: number, lng?: number }) => {
      try {
        const user = await prisma.user.findUnique({ where: { id: data.driverId } });
        if (!user || user.approvalStatus !== 'APPROVED') {
          socket.emit('driver_error', { message: 'Your account is pending admin approval or has been rejected.' });
          return;
        }
        // ─── Block if commission is owed ───────────────────────────────────
        if (user.commissionOwed > 0) {
          socket.emit('driver_error', {
            message: `You have an unpaid commission of ${user.commissionOwed.toFixed(2)} EGP. Please pay it via your wallet before going online.`,
            code: 'COMMISSION_DEBT',
            commissionOwed: user.commissionOwed
          });
          return;
        }
        // ──────────────────────────────────────────────────────────────────
        onlineDrivers.set(socket.id, { ...data, socketId: socket.id });
        io.emit('drivers_updated', Array.from(onlineDrivers.values()));
        console.log(`✅ Driver ${data.driverName} is ONLINE`);
      } catch (err) {
        console.error('Error going online:', err);
      }
    });

    // ── Driver goes OFFLINE ───────────────────────────────────────────────────
    socket.on('driver_offline', () => {
      onlineDrivers.delete(socket.id);
      io.emit('drivers_updated', Array.from(onlineDrivers.values()));
    });

    // ── Get current online drivers (on demand) ────────────────────────────────
    socket.on('get_drivers', async () => {
      try {
        const driversList = Array.from(onlineDrivers.entries());
        for (const [sid, d] of driversList) {
          if (d && d.driverId) {
            const userExists = await prisma.user.findUnique({ where: { id: d.driverId } });
            if (!userExists) {
              onlineDrivers.delete(sid);
            }
          }
        }
      } catch (err) {
        console.error('Error validating online drivers:', err);
      }
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
      lat?: number;
      lng?: number;
      pickupLat?: number;
      pickupLng?: number;
      dropoffLat?: number;
      dropoffLng?: number;
      pickupAddress?: string;
      dropoffAddress?: string;
      tripDistance?: number;
    }) => {
      const driverSocket = io.sockets.sockets.get(data.driverSocketId);
      if (driverSocket) {
        const driverData = onlineDrivers.get(data.driverSocketId);
        let distanceStr = 'Nearby';
        if (data.lat && data.lng && driverData?.lat && driverData?.lng) {
          const distKm = calculateDistance(data.lat, data.lng, driverData.lat, driverData.lng);
          distanceStr = `${distKm.toFixed(1)} km`;
        }

        driverSocket.emit('new_request', {
          customerId: data.customerId,
          customerName: data.customerName,
          customerSocketId: socket.id,
          car: data.car,
          issue: data.issue,
          price: data.price,
          distance: distanceStr,
          lat: data.lat,
          lng: data.lng,
          pickupLat: data.pickupLat || data.lat,
          pickupLng: data.pickupLng || data.lng,
          dropoffLat: data.dropoffLat,
          dropoffLng: data.dropoffLng,
          pickupAddress: data.pickupAddress,
          dropoffAddress: data.dropoffAddress,
          tripDistance: data.tripDistance
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
      pickupLat?: number;
      pickupLng?: number;
      dropoffLat?: number;
      dropoffLng?: number;
      priceIsAdjusted?: boolean;
    }) => {
      onlineDrivers.delete(socket.id);
      io.emit('drivers_updated', Array.from(onlineDrivers.values()));

      try {
        const initialStatus = data.priceIsAdjusted ? 'Pending_Approval' : 'Active';
        const booking = await prisma.winchBooking.create({
          data: {
            userId: data.customerId,
            driverId: data.driverId,
            driverName: data.driverName,
            vehicle: data.vehicle,
            price: data.price,
            status: initialStatus,
            userLat: data.pickupLat,
            userLng: data.pickupLng,
            destLat: data.dropoffLat,
            destLng: data.dropoffLng,
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
            status: initialStatus,
            userLat: data.pickupLat,
            userLng: data.pickupLng,
            destLat: data.dropoffLat,
            destLng: data.dropoffLng,
          });
        }

        socket.emit('booking_started', {
          bookingId,
          customerId: data.customerId,
          status: initialStatus,
          userLat: data.pickupLat,
          userLng: data.pickupLng,
          destLat: data.dropoffLat,
          destLng: data.dropoffLng,
        });
        console.log(`🚗 Booking ${bookingId} created with pickup/destination coordinates. Status: ${initialStatus}`);
      } catch (err) {
        console.error('Booking creation error:', err);
        socket.emit('booking_error', { message: 'Could not create booking.' });
      }
    });

    // ── Owner Approves Price ────────────────────────────────────────────────────
    socket.on('approve_booking_price', async (data: { bookingId: string }) => {
      try {
        const booking = await prisma.winchBooking.update({
          where: { id: data.bookingId },
          data: { status: 'Active' }
        });
        io.to(`winch_${data.bookingId}`).emit('booking_status', { bookingId: booking.id, status: 'Active' });
        console.log(`Booking ${data.bookingId} approved by customer. Status: Active`);
      } catch (err) {
        console.error('approve_booking_price error:', err);
        socket.emit('booking_error', { message: 'Could not approve booking price.' });
      }
    });

    // ── Driver DECLINES ────────────────────────────────────────────────────────
    socket.on('decline_request', (data: { customerSocketId: string }) => {
      const customerSocket = io.sockets.sockets.get(data.customerSocketId);
      if (customerSocket) {
        customerSocket.emit('request_declined', { message: 'Driver declined your request. Please choose another driver.' });
      }
    });

    // ── Driver COUNTERS ────────────────────────────────────────────────────────
    socket.on('driver_counter_offer', (data: { customerSocketId: string, driverId: string, price: number, driverName?: string, vehicle?: string, eta?: string }) => {
      const customerSocket = io.sockets.sockets.get(data.customerSocketId);
      if (customerSocket) {
        customerSocket.emit('driver_countered', {
          driverId: data.driverId,
          price: data.price,
          driverName: data.driverName,
          vehicle: data.vehicle,
          eta: data.eta,
        });
      }
    });

    // ── Customer COUNTERS back ─────────────────────────────────────────────────
    socket.on('customer_counter_offer', (data: { driverSocketId: string, customerId: string, price: number }) => {
      const driverSocket = io.sockets.sockets.get(data.driverSocketId);
      if (driverSocket) {
        driverSocket.emit('customer_countered', { customerId: data.customerId, price: data.price });
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
      try {
        const updateData: any = {};
        if (data.driverLat) updateData.driverLat = data.driverLat;
        if (data.driverLng) updateData.driverLng = data.driverLng;
        if (data.userLat) updateData.userLat = data.userLat;
        if (data.userLng) updateData.userLng = data.userLng;

        let distanceStr = '';
        let etaStr = '';

        if (Object.keys(updateData).length > 0) {
          const updatedBooking = await prisma.winchBooking.update({
            where: { id: data.bookingId },
            data: updateData
          });

          // Calculate ETA if both coordinates exist
          const isTowing = updatedBooking.status === 'In Progress';
          const targetLat = isTowing ? updatedBooking.destLat : updatedBooking.userLat;
          const targetLng = isTowing ? updatedBooking.destLng : updatedBooking.userLng;

          if (targetLat && targetLng && updatedBooking.driverLat && updatedBooking.driverLng) {
            const distKm = calculateDistance(
              targetLat, targetLng,
              updatedBooking.driverLat, updatedBooking.driverLng
            );
            
            // Assume 30 km/h average city speed
            const timeHours = distKm / 30;
            const timeMins = Math.ceil(timeHours * 60);
            
            distanceStr = distKm < 1 ? `${(distKm * 1000).toFixed(0)} m` : `${distKm.toFixed(1)} km`;
            etaStr = `${timeMins} min`;
            
            // If less than 100 meters and status was Active, auto mark arrived
            if (distKm < 0.1 && updatedBooking.status === 'Active') {
               await prisma.winchBooking.update({
                 where: { id: data.bookingId },
                 data: { status: 'Arrived' }
               });
               io.to(`winch_${data.bookingId}`).emit('booking_status', { bookingId: data.bookingId, status: 'Arrived' });
            }
          }
        }

        // Emit updated data with ETA
        io.to(`winch_${data.bookingId}`).emit('location_updated', {
          ...data,
          distance: distanceStr || undefined,
          eta: etaStr || undefined
        });

      } catch (err) {
        console.error('Location update error:', err);
      }
    });

    // ── Driver Arrived ────────────────────────────────────────────────────────
    socket.on('driver_arrived', async (data: { bookingId: string }) => {
      try {
        const booking = await prisma.winchBooking.update({
          where: { id: data.bookingId },
          data: { status: 'Arrived' }
        });
        io.to(`winch_${data.bookingId}`).emit('booking_status', { bookingId: booking.id, status: 'Arrived' });
        console.log(`Booking ${data.bookingId} status: Arrived`);
      } catch (err) {
        console.error('driver_arrived error:', err);
      }
    });

    // ── Pickup Done ──────────────────────────────────────────────────────────
    socket.on('pickup_done', async (data: { bookingId: string }) => {
      try {
        const booking = await prisma.winchBooking.update({
          where: { id: data.bookingId },
          data: { status: 'In Progress' }
        });
        io.to(`winch_${data.bookingId}`).emit('booking_status', { bookingId: booking.id, status: 'In Progress' });
        console.log(`Booking ${data.bookingId} status: In Progress`);
      } catch (err) {
        console.error('pickup_done error:', err);
      }
    });

    // ── Driver Complete Trip (Prompt Customer for Payment) ──────────────────────
    socket.on('driver_complete_trip', async (data: { bookingId: string }) => {
      try {
        const booking = await prisma.winchBooking.update({
          where: { id: data.bookingId },
          data: { status: 'Payment_Pending' }
        });
        io.to(`winch_${data.bookingId}`).emit('booking_status', { bookingId: booking.id, status: 'Payment_Pending', price: booking.price });
        console.log(`Booking ${data.bookingId} status: Payment_Pending`);
      } catch (err) {
        console.error('driver_complete_trip error:', err);
      }
    });

    // ── Process Payment ────────────────────────────────────────────────────────
    socket.on('pay_booking', async (data: { bookingId: string, paymentMethod: 'CASH' | 'WALLET' | 'CARD' }) => {
      try {
        const booking = await prisma.winchBooking.findUnique({ where: { id: data.bookingId } });
        if (!booking) {
          socket.emit('booking_error', { message: 'Booking not found.' });
          return;
        }

        const amount = booking.price;
        const commission = parseFloat((amount * 0.10).toFixed(2)); // 10% platform fee
        const driverShare = parseFloat((amount * 0.90).toFixed(2)); // 90% driver share

        if (data.paymentMethod === 'WALLET') {
          const user = await prisma.user.findUnique({ where: { id: booking.userId } });
          if (!user || user.walletBalance < amount) {
            socket.emit('booking_error', { message: 'Insufficient wallet balance.' });
            return;
          }

          await prisma.$transaction(async (tx) => {
            await tx.user.update({
              where: { id: booking.userId },
              data: { walletBalance: { decrement: amount } }
            });
            await tx.user.update({
              where: { id: booking.driverId },
              data: { walletBalance: { increment: driverShare } }
            });
            await tx.transaction.create({
              data: {
                userId: booking.userId,
                providerId: booking.driverId,
                amount: amount,
                commission: commission,
                type: 'Winch Ride - Wallet',
                status: 'Completed'
              }
            });
            await tx.winchBooking.update({
              where: { id: data.bookingId },
              data: { status: 'Completed' }
            });
          });
        } else if (data.paymentMethod === 'CARD') {
          await prisma.$transaction(async (tx) => {
            await tx.user.update({
              where: { id: booking.driverId },
              data: { walletBalance: { increment: driverShare } }
            });
            await tx.transaction.create({
              data: {
                userId: booking.userId,
                providerId: booking.driverId,
                amount: amount,
                commission: commission,
                type: 'Winch Ride - Card',
                status: 'Completed'
              }
            });
            await tx.winchBooking.update({
              where: { id: data.bookingId },
              data: { status: 'Completed' }
            });
          });
        } else {
          // CASH payment
          await prisma.$transaction(async (tx) => {
            await tx.user.update({
              where: { id: booking.driverId },
              data: { commissionOwed: { increment: commission } }
            });
            await tx.transaction.create({
              data: {
                userId: booking.userId,
                providerId: booking.driverId,
                amount: amount,
                commission: commission,
                type: 'Winch Ride - Cash',
                status: 'Completed'
              }
            });
            await tx.winchBooking.update({
              where: { id: data.bookingId },
              data: { status: 'Completed' }
            });
          });
        }

        io.to(`winch_${data.bookingId}`).emit('booking_completed', {
          bookingId: data.bookingId,
          paymentMethod: data.paymentMethod,
          price: amount
        });
        console.log(`Booking ${data.bookingId} paid successfully via ${data.paymentMethod}`);
      } catch (err) {
        console.error('pay_booking error:', err);
        socket.emit('booking_error', { message: 'Could not process payment.' });
      }
    });

    // ── Customer CANCELS booking ───────────────────────────────────────────────
    socket.on('cancel_booking', async (data: { bookingId: string }) => {
      try {
        const booking = await prisma.winchBooking.findUnique({ where: { id: data.bookingId } });
        if (!booking) return;

        await prisma.winchBooking.update({
          where: { id: data.bookingId },
          data: { status: 'Cancelled' }
        });

        io.to(`winch_${data.bookingId}`).emit('booking_cancelled', { bookingId: data.bookingId });
        console.log(`❌ Booking ${data.bookingId} cancelled by customer`);
      } catch (err) {
        console.error('Cancel booking error:', err);
      }
    });

    // Legacy complete_booking wrapper for safety
    socket.on('complete_booking', async (data: { bookingId: string }) => {
      try {
        const booking = await prisma.winchBooking.findUnique({ where: { id: data.bookingId } });
        if (!booking) return;

        const commission = parseFloat((booking.price * 0.10).toFixed(2));
        await prisma.$transaction([
          prisma.user.update({
            where: { id: booking.driverId },
            data: { commissionOwed: { increment: commission } }
          }),
          prisma.transaction.create({
            data: {
              userId: booking.userId,
              providerId: booking.driverId,
              amount: booking.price,
              commission: commission,
              type: 'Winch Ride - Cash',
              status: 'Completed'
            }
          }),
          prisma.winchBooking.update({
            where: { id: data.bookingId },
            data: { status: 'Completed' }
          })
        ]);

        io.to(`winch_${data.bookingId}`).emit('booking_completed', { bookingId: data.bookingId, paymentMethod: 'CASH' });
      } catch (err) {
        console.error('complete_booking legacy error:', err);
      }
    });

    // ── MECHANIC BIDDING SYSTEM ────────────────────────────────────────────────
    socket.on('new_repair_request', (data: any) => {
      // Broadcast to all online workshops (or all users for simplicity here)
      io.emit('broadcast_repair_request', data);
      console.log('📢 New repair request broadcasted:', data);
    });

    socket.on('new_repair_bid', (data: any) => {
      // Broadcast the bid to the specific user who made the request
      io.emit(`new_bid_${data.repairRequestId}`, data);
      console.log('💰 New bid received for request:', data.repairRequestId);
    });

    socket.on('bid_accepted', (data: any) => {
      // Broadcast that a bid was accepted
      io.emit(`bid_accepted_${data.repairRequestId}`, data);
      console.log('✅ Bid accepted for request:', data.repairRequestId);
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
