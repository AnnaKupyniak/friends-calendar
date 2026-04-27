import React, { useEffect, useState } from 'react';
import {
  getNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  deleteNotification
} from '../../api/memoriesAPI';

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications(1, 10);
      setNotifications(data.data);
      
      const unread = await getUnreadNotifications();
      setUnreadCount(unread.count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="notifications-panel">
      <h3>Сповіщення ({unreadCount} непрочитаних)</h3>
      {loading ? (
        <p>Завантаження...</p>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div 
              key={notification._id} 
              className={`notification ${!notification.isRead ? 'unread' : ''}`}
            >
              <div className="notification-header">
                <strong>{notification.title}</strong>
                {notification.sender && (
                  <span className="sender">від {notification.senderId.fullName}</span>
                )}
              </div>
              <p>{notification.message}</p>
              <div className="notification-actions">
                {!notification.isRead && (
                  <button onClick={() => handleMarkAsRead(notification._id)}>
                    Позначити як прочитане
                  </button>
                )}
                <button onClick={() => handleDelete(notification._id)}>
                  Видалити
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
