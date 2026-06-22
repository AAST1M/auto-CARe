import prisma from '../prismaClient';
import { getOnlineUserIds, getOnlineUsersCount } from '../socket';

export async function getAdminStats() {
  // 1. Count users by role
  const users = await prisma.user.findMany({
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
      roleCounts[u.role as keyof typeof roleCounts]++;
    }
  });

  // 2. Count workshops
  const workshopCount = await prisma.workshop.count();

  // 3. Workshop Appointments stats
  const appointments = await prisma.appointment.findMany({
    where: {
      status: { in: ['Completed', 'Confirmed', 'Checked-In'] }
    },
    select: { price: true, status: true }
  });

  const activeApptCount = await prisma.appointment.count({
    where: {
      status: { in: ['Pending', 'Confirmed', 'Checked-In'] }
    }
  });

  // 4. Winch Bookings stats
  const winchBookings = await prisma.winchBooking.findMany({
    where: { status: 'Completed' },
    select: { price: true }
  });

  // Calculations
  const workshopRevenue = appointments.reduce((sum, item) => sum + item.price, 0);
  const winchRevenue = winchBookings.reduce((sum, item) => sum + item.price, 0);
  const totalRevenue = workshopRevenue + winchRevenue;
  
  // 10% platform commission
  const totalCommission = totalRevenue * 0.1;

  return {
    users: roleCounts,
    workshops: workshopCount,
    revenue: totalRevenue,
    commission: totalCommission,
    activeAppointments: activeApptCount,
    completedAppointments: appointments.filter(a => a.status === 'Completed').length,
    completedWinchBookings: winchBookings.length,
    onlineUsersCount: getOnlineUsersCount(),
    systemHealth: 'OK'
  };
}

export async function getAdminTransactions() {
  // Fetch all users to map names/emails
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true }
  });
  const userMap = new Map(allUsers.map(u => [u.id, u.name || u.email]));

  // Fetch workshop appointments
  const appointments = await prisma.appointment.findMany({
    include: {
      workshop: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch winch bookings
  const winchBookings = await prisma.winchBooking.findMany({
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
  return [...formattedAppts, ...formattedWinch].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getAdminUsers() {
  const users = await prisma.user.findMany({
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

  const onlineUserIds = getOnlineUserIds();
  return users.map(u => ({
    ...u,
    isOnline: onlineUserIds.includes(u.id)
  }));
}
