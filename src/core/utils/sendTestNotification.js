/**
 * Utility to send a test FCM notification with custom sound
 * 
 * This is for development testing purposes only.
 * In production, notifications should be sent from your backend server.
 */

import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

/**
 * Send a local test notification with custom sound
 * This simulates receiving a notification while the app is in foreground
 */
export const sendLocalTestNotification = async () => {
  try {
    // Get the device token
    const token = await messaging().getToken();
    console.log('FCM Token:', token);

    // Prepare the notification payload
    const notificationData = {
      to: token,
      notification: {
        title: "Test Notification",
        body: "This is a test notification with custom sound"
      },
      data: {
        orderCode: "TEST123",
        targetScr: "ORDER-PICK",
        sound: "ding",
        channelId: "default_channel_id"
      },
      android: {
        notification: {
          sound: "ding",
          channel_id: "default_channel_id",
          priority: "high"
        }
      },
      apns: {
        payload: {
          aps: {
            sound: "ding.mp3",
            badge: 1,
            "content-available": 1
          }
        }
      }
    };

    console.log('Sending test notification...', notificationData);

    // Send the notification to the current device
    // Note: In a real app, this should be sent from your backend
    fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'key=YOUR_SERVER_KEY' // Replace with your actual server key
      },
      body: JSON.stringify(notificationData)
    })
    .then(response => response.json())
    .then(data => {
      console.log('FCM response:', data);
    })
    .catch(error => {
      console.error('Error sending test notification:', error);
    });

    return true;
  } catch (error) {
    console.error('Failed to send test notification:', error);
    return false;
  }
};

/**
 * Instructions for testing notifications in different states:
 * 
 * 1. App in Foreground:
 *    - Simply call sendLocalTestNotification() while app is running
 * 
 * 2. App in Background:
 *    - Press home button to put app in background
 *    - Send notification from Firebase console or your backend
 * 
 * 3. App Completely Closed (Quit):
 *    - Force close the app completely
 *    - Send notification from Firebase console or your backend
 */ 