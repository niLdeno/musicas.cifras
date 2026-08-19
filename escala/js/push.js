// ============================================================================
//  Web Push (PWA). Cuida da permissão do navegador, da inscrição (endpoint +
//  chaves) e de exibir notificações. Em MODO DEMO a inscrição no servidor é
//  ignorada, mas a permissão e a notificação de teste funcionam de verdade.
// ============================================================================
import { CONFIG } from './config.js';
import { store } from './data/store.js';

export function suportado() {
  return 'serviceWorker' in navigator && 'Notification' in window;
}

export function permissao() {
  return suportado() ? Notification.permission : 'unsupported';
}

export async function pedirPermissao() {
  if (!suportado()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

async function registrarSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('./sw.js');
  } catch (_) {
    return null;
  }
}

function urlB64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// Inscreve o dispositivo para push (só faz efeito real no backend Supabase).
export async function ativar(pessoaId) {
  const perm = await pedirPermissao();
  if (perm !== 'granted') throw new Error('Permissão de notificação negada.');
  const reg = await registrarSW();

  // No backend real: cria a PushSubscription e grava em push_subscriptions.
  if (store.modo === 'supabase' && reg && 'PushManager' in window && CONFIG.VAPID_PUBLIC_KEY) {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
    });
    const json = sub.toJSON();
    await store.sb.from('push_subscriptions').insert([{
      pessoa_id: pessoaId,
      endpoint: sub.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent,
    }]);
  } else {
    await store.notif.setPref(true);
  }
  return true;
}

export async function desativar(pessoaId) {
  if (store.modo === 'supabase' && 'serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg && (await reg.pushManager.getSubscription());
    if (sub) {
      await store.sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
  } else {
    await store.notif.setPref(false);
  }
}

export async function notificarTeste(titulo, corpo) {
  if (permissao() !== 'granted') throw new Error('Ative as notificações primeiro.');
  const reg = await registrarSW();
  const opcoes = { body: corpo, icon: './icons/icon-192.png', badge: './icons/badge.png', tag: 'cscb-teste' };
  if (reg && reg.showNotification) await reg.showNotification(titulo, opcoes);
  else new Notification(titulo, opcoes);
}
