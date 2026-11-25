import { useCallback, useEffect, useState } from 'react';
import { getVapidPublicKey, subscribePush, unsubscribePush } from '../services/api';

export type PushNotificationStatus =
  | 'unsupported'
  | 'idle'
  | 'subscribed'
  | 'denied'
  | 'loading'
  | 'error';

export interface UsePushNotificationsResult {
  status: PushNotificationStatus;
  error: string | null;
  enablePush: () => Promise<void>;
  disablePush: () => Promise<void>;
}

function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function resolvePushError(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Push notification error';
}

export function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | null): string | null {
  if (!buffer) return null;
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function extractSubscriptionKeys(sub: PushSubscription): { p256dh: string; auth: string } {
  const jsonKeys = sub.toJSON().keys;
  const p256dh = jsonKeys?.p256dh || arrayBufferToBase64Url(sub.getKey('p256dh'));
  const auth = jsonKeys?.auth || arrayBufferToBase64Url(sub.getKey('auth'));
  if (!p256dh || !auth) {
    throw new Error('Browser push subscription is missing encryption keys.');
  }
  return { p256dh, auth };
}

async function syncSubscriptionWithBackend(sub: PushSubscription): Promise<void> {
  const keys = extractSubscriptionKeys(sub);
  await subscribePush({
    endpoint: sub.endpoint,
    keys,
    user_agent: navigator.userAgent || null,
  });
}

async function resolveReadyRegistration(): Promise<ServiceWorkerRegistration | null> {
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (!existing && !import.meta.env.PROD) {
    return null;
  }
  return navigator.serviceWorker.ready;
}

async function reconcileExistingPush(): Promise<PushNotificationStatus> {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await resolveReadyRegistration();
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  if (!sub) return 'idle';
  await syncSubscriptionWithBackend(sub);
  return 'subscribed';
}

async function subscribeBrowserPush(): Promise<{ status: PushNotificationStatus; error: string | null }> {
  const vapid = await getVapidPublicKey();
  if (!vapid.enabled || !vapid.public_key) {
    throw new Error('Web Push VAPID is not enabled on Chronos.');
  }
  const permission = await Notification.requestPermission();
  if (permission === 'denied') {
    return { status: 'denied', error: 'Notification permission was denied in browser settings.' };
  }
  if (permission !== 'granted') {
    return { status: 'idle', error: null };
  }
  await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid.public_key),
    }));
  await syncSubscriptionWithBackend(sub);
  return { status: 'subscribed', error: null };
}

async function unsubscribeBrowserPush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration('/');
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  if (sub) {
    await unsubscribePush(sub.endpoint);
    await sub.unsubscribe();
  }
}

function useReconcilePushOnMount(
  setStatus: React.Dispatch<React.SetStateAction<PushNotificationStatus>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): void {
  useEffect(() => {
    let active = true;
    reconcileExistingPush()
      .then((nextStatus) => {
        if (active) {
          setStatus(nextStatus);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setStatus('error');
          setError(resolvePushError(err));
        }
      });
    return () => {
      active = false;
    };
  }, [setStatus, setError]);
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [status, setStatus] = useState<PushNotificationStatus>(() =>
    isPushSupported() ? 'loading' : 'unsupported'
  );
  const [error, setError] = useState<string | null>(null);
  useReconcilePushOnMount(setStatus, setError);

  const enablePush = useCallback(async () => {
    if (!isPushSupported()) return setStatus('unsupported');
    setStatus('loading');
    setError(null);
    try {
      const outcome = await subscribeBrowserPush();
      setStatus(outcome.status);
      setError(outcome.error);
    } catch (err: unknown) {
      setStatus('error');
      setError(resolvePushError(err));
    }
  }, []);

  const disablePush = useCallback(async () => {
    if (!isPushSupported()) return setStatus('unsupported');
    setStatus('loading');
    setError(null);
    try {
      await unsubscribeBrowserPush();
      setStatus('idle');
    } catch (err: unknown) {
      setStatus('error');
      setError(resolvePushError(err));
    }
  }, []);

  return { status, error, enablePush, disablePush };
}
