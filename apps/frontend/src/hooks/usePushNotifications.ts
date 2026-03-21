import { useEffect } from 'react';
import api from '../api/axios';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    navigator.serviceWorker.ready
      .then(async (reg) => {
        const { data } = await api.get('/push/vapid-public-key');
        if (!data.publicKey) return;
        const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
        }
        await api.post('/push/subscribe', {
          endpoint: sub.endpoint,
          keys: {
            p256dh: btoa(
              String.fromCharCode(
                ...new Uint8Array((sub.getKey('p256dh') as ArrayBuffer)),
              ),
            ),
            auth: btoa(
              String.fromCharCode(
                ...new Uint8Array((sub.getKey('auth') as ArrayBuffer)),
              ),
            ),
          },
        });
      })
      .catch(() => {
        // silently ignore — user may have denied permission or VAPID not configured
      });
  }, []);
}
