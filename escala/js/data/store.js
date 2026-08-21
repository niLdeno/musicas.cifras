// ============================================================================
//  Seletor de backend. MODO DEMO (mock/localStorage) enquanto o Supabase não
//  estiver configurado em config.js; caso contrário, backend Supabase real.
//  Ambos expõem a MESMA API assíncrona, então as telas não sabem a diferença.
// ============================================================================
import { CONFIG, modoDemo } from '../config.js';
import { criarMockStore } from './mock.js';

export let store = null;

export async function initStore() {
  if (modoDemo()) {
    store = criarMockStore();
  } else {
    const { criarSupaStore } = await import('./supa.js');
    store = await criarSupaStore();
  }
  return store;
}
