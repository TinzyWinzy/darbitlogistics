import { useState, useEffect } from 'react';
import { deliveryApi } from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) {
            setIsSubscribed(true);
            setSubscription(sub);
          }
        });
      });
    }
  }, []);

  const subscribeToPush = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        setIsSubscribed(true);
        setSubscription(existingSub);
        return;
      }

      // Fetch VAPID public key from your server
      const response = await deliveryApi.getVapidPublicKey();
      const vapidPublicKey = response.publicKey;
      
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // Send subscription to your backend
      await deliveryApi.subscribe(newSub);

      setIsSubscribed(true);
      setSubscription(newSub);
      setError(null);
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
      setError(err);
    }
  };

  return {
    isSubscribed,
    subscribeToPush,
    subscription,
    error,
  };
} 