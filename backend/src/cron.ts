import cron from 'node-cron';
import prisma from './prismaClient';

// Schedule a task to run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('[Cron] Running stale booking cleanup job...');
  try {
    // A booking is stale if it's 'Pending' and created more than 15 minutes ago
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const staleBookings = await prisma.winchBooking.updateMany({
      where: {
        status: 'Pending',
        createdAt: {
          lt: fifteenMinutesAgo,
        },
      },
      data: {
        status: 'Cancelled',
      },
    });

    if (staleBookings.count > 0) {
      console.log(`[Cron] Cancelled ${staleBookings.count} stale winch bookings.`);
    } else {
      console.log('[Cron] No stale bookings found.');
    }
  } catch (error) {
    console.error('[Cron] Error cleaning up stale bookings:', error);
  }
});

console.log('[Cron] Cron jobs initialized.');
