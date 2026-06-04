import { Server, Socket } from 'socket.io';
import prisma from './prismaClient';

export function setupSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('⚡ Client connected to WebSockets:', socket.id);

    // Join a specific room for a booking
    socket.on('join_winch_room', (bookingId: string) => {
      socket.join(`winch_${bookingId}`);
      console.log(`Socket ${socket.id} joined room winch_${bookingId}`);
    });

    // Handle real-time location updates
    socket.on('update_location', async (data: { bookingId: string, driverLat?: number, driverLng?: number, userLat?: number, userLng?: number, status?: string }) => {
      const { bookingId, driverLat, driverLng, userLat, userLng, status } = data;
      
      // Broadcast immediately to the room for zero-latency updates
      io.to(`winch_${bookingId}`).emit('location_updated', data);

      // Persist to database asynchronously
      try {
        const updateData: any = {};
        if (driverLat) updateData.driverLat = driverLat;
        if (driverLng) updateData.driverLng = driverLng;
        if (userLat) updateData.userLat = userLat;
        if (userLng) updateData.userLng = userLng;
        
        if (Object.keys(updateData).length > 0) {
            await prisma.winchBooking.update({
                where: { id: bookingId },
                data: updateData
            });
        }
      } catch (error) {
        console.error('Error saving socket location:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
