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

  // 5. Pending commission stats
  const driversWithDebt = await prisma.user.findMany({
    where: { role: 'WINCH_DRIVER', commissionOwed: { gt: 0 } },
    select: { commissionOwed: true }
  });
  const pendingCommissionTotal = driversWithDebt.reduce((sum, d) => sum + d.commissionOwed, 0);
  const pendingCommissionDrivers = driversWithDebt.length;

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
    pendingCommissionTotal,
    pendingCommissionDrivers,
    systemHealth: 'OK'
  };
}

export async function getAdminTransactions() {
  // Fetch workshop appointments with users
  const appointments = await prisma.appointment.findMany({
    include: {
      user: {
        select: { name: true, email: true }
      },
      workshop: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch winch bookings with users
  const winchBookings = await prisma.winchBooking.findMany({
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Format workshop transactions
  const formattedAppts = appointments.map(appt => ({
    id: appt.id,
    type: 'Workshop Booking',
    date: appt.createdAt,
    customerName: appt.user ? (appt.user.name || appt.user.email) : 'Unknown User',
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
    customerName: wb.user ? (wb.user.name || wb.user.email) : 'Unknown User',
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
      createdAt: true,
      approvalStatus: true,
      commissionOwed: true,
      licenseExpiry: true,
      plateNumber: true,
      criminalRecordCert: true,
      driverPhoto: true,
      nationalIdCard: true,
      taxCard: true,
      workshopLocation: true,
      ownerNationalIdCard: true,
      workshopName: true,
      userPlateNumber: true,
      userNationalId: true,
      carBrand: true,
      carModel: true,
      carYear: true,
      chassisNumber: true,
      carPhotoFront: true,
      carPhotoBack: true,
      carPhotoRight: true,
      carPhotoLeft: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const onlineUserIds = getOnlineUserIds();
  return users.map(u => ({
    ...u,
    isOnline: onlineUserIds.includes(u.id)
  }));
}

// ─── Get all winch drivers with pending commission debt ───────────────────────
export async function getDriverCommissions() {
  const drivers = await prisma.user.findMany({
    where: { role: 'WINCH_DRIVER' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      commissionOwed: true,
      walletBalance: true,
      approvalStatus: true
    },
    orderBy: { commissionOwed: 'desc' }
  });

  // Fetch ride counts per driver
  const rideCounts = await prisma.winchBooking.groupBy({
    by: ['driverId'],
    _count: { id: true }
  });
  const rideCountMap = new Map(rideCounts.map(r => [r.driverId, r._count.id]));

  return drivers.map(d => ({
    ...d,
    totalRides: rideCountMap.get(d.id) || 0,
    hasDebt: d.commissionOwed > 0
  }));
}

