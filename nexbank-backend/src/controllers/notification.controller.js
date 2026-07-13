import Notification from '../models/notification.model.js';

export const listNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.userId })
    .sort({ createdAt: -1 })
    .limit(10);

  return res.status(200).json({
    success: true,
    message: 'Notifications fetched successfully',
    data: notifications,
  });
};

export const markNotificationsRead = async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.userId, isRead: false },
    { $set: { isRead: true } },
  );

  return res.status(200).json({
    success: true,
    message: 'Notifications marked as read',
  });
};
