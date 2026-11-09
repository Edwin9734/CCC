// Genera las claves de las notificaciones. Se ejecuta una sola vez con:
//   node scripts/claves-notificaciones.mjs
// Copia cada línea a las variables de entorno de Vercel. No las compartas ni las subas a GitHub.
import { randomBytes } from "node:crypto";
import { generateVAPIDKeys } from "web-push";

const { publicKey, privateKey } = generateVAPIDKeys();

console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log(`CRON_SECRET=${randomBytes(32).toString("hex")}`);
