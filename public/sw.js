self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Llega un recordatorio aunque la app esté cerrada.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const doses = Array.isArray(data.doses) ? data.doses : [];

  event.waitUntil(
    self.registration.showNotification(data.title || "Control de Colesterol", {
      body: data.body || "Abre la app para ver tu recordatorio.",
      icon: "/icons/icon-192.png",
      tag: data.tag || "recordatorio",
      renotify: true,
      vibrate: [200, 100, 200, 100, 300],
      data: { url: data.url || "/medicamentos?tab=hoy", doses },
      actions: doses.length > 0 ? [{ action: "taken", title: "Ya la tomé" }, { action: "open", title: "Abrir" }] : []
    })
  );
});

async function openApp(url) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
  if (existing) {
    await existing.focus();
    if ("navigate" in existing) await existing.navigate(url);
    return;
  }
  await self.clients.openWindow(url);
}

async function markTaken(data) {
  try {
    const response = await fetch("/api/recordatorios/tomada", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ doses: data.doses })
    });
    if (!response.ok) throw new Error("No se pudo marcar");

    // Si la app está abierta, se actualiza sin tener que recargarla.
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    windows.forEach((client) => client.postMessage({ type: "doses-updated" }));
  } catch {
    // Si no se pudo (sin sesión o sin internet), se abre la app para marcarla ahí.
    await openApp(data.url);
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || "/medicamentos?tab=hoy";
  event.waitUntil(event.action === "taken" && data.doses?.length ? markTaken({ ...data, url }) : openApp(url));
});
