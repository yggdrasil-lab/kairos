/* Minimal persistent push-only Service Worker for Kairos (no fetch caching). */

const DEFAULT_PUSH_PAYLOAD = {
  title: 'Kairos',
  body: 'Scheduled focus block update.',
  tag: 'kairos-nudge',
  url: '/?tab=now',
  source_kind: 'grid_block',
  stage: 'boundary',
};

function parsePushPayload(event) {
  if (!event.data) {
    return { ...DEFAULT_PUSH_PAYLOAD };
  }
  try {
    const parsed = event.data.json();
    return {
      title: typeof parsed.title === 'string' && parsed.title ? parsed.title : DEFAULT_PUSH_PAYLOAD.title,
      body: typeof parsed.body === 'string' && parsed.body ? parsed.body : DEFAULT_PUSH_PAYLOAD.body,
      tag: typeof parsed.tag === 'string' && parsed.tag ? parsed.tag : DEFAULT_PUSH_PAYLOAD.tag,
      url: typeof parsed.url === 'string' && parsed.url ? parsed.url : DEFAULT_PUSH_PAYLOAD.url,
      source_kind: typeof parsed.source_kind === 'string' ? parsed.source_kind : DEFAULT_PUSH_PAYLOAD.source_kind,
      stage: typeof parsed.stage === 'string' ? parsed.stage : DEFAULT_PUSH_PAYLOAD.stage,
    };
  } catch {
    const text = event.data.text();
    return {
      ...DEFAULT_PUSH_PAYLOAD,
      body: text || DEFAULT_PUSH_PAYLOAD.body,
    };
  }
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const payload = parsePushPayload(event);
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      renotify: false,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      actions: [{ action: 'open-now', title: 'Open Now' }],
      data: {
        url: payload.url || '/?tab=now',
        source_kind: payload.source_kind,
        stage: payload.stage,
      },
    })
  );
});

async function focusOrOpenNow(targetUrl) {
  const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of windowClients) {
    if (!client.url.startsWith(self.location.origin) || !('focus' in client)) {
      continue;
    }
    if ('navigate' in client && client.url !== targetUrl) {
      const navigated = await client.navigate(targetUrl).catch(() => null);
      return (navigated || client).focus();
    }
    return client.focus();
  }
  if (self.clients.openWindow) {
    return self.clients.openWindow(targetUrl);
  }
  return undefined;
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data;
  const targetPath = data && typeof data.url === 'string' && data.url ? data.url : '/?tab=now';
  const targetUrl = new URL(targetPath, self.location.origin).href;
  event.waitUntil(focusOrOpenNow(targetUrl));
});
