/**
 * Envoie un magic link Tilawa Tour à tous les inscrits dans email_subscribers.
 * Usage : node send-app-link.mjs
 * Requiert : npm install @supabase/supabase-js  (ou bun add @supabase/supabase-js)
 */
import { createClient } from '@supabase/supabase-js';

/* ─── Jumuatime — lecture email_subscribers ─── */
const SB_JM_URL  = 'https://qsvozaxqeamrdkmujoze.supabase.co';
const SB_JM_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzdm96YXhxZWFtcmRrbXVqb3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMzgyMDUsImV4cCI6MjA5NTcxNDIwNX0.3n6D7gfxb7qNi24brfxc59qwG-g4cT0s0kRq5fbSE-o';

/* ─── Tilawa Tour — envoi des OTP / magic links ─── */
const SB_TL_URL  = 'https://lekirecmfhewsnozgusm.supabase.co';
const SB_TL_KEY  = 'sb_publishable_9O8kw2OwMKT5Kw4PBlHnew_l44qd46X';

const jm = createClient(SB_JM_URL, SB_JM_KEY);
const tl = createClient(SB_TL_URL, SB_TL_KEY);

/* Délai entre chaque envoi pour éviter le rate-limit Supabase (250 ms) */
const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  /* 1. Récupère tous les emails (email_subscribers + beta_access, dédupliqués) */
  const [{ data: d1, error: err1 }, { data: d2, error: err2 }] = await Promise.all([
    jm.from('email_subscribers').select('email'),
    jm.from('beta_access').select('email'),
  ]);
  if (err1 || err2) { console.error('Erreur lecture Supabase :', (err1 || err2).message); process.exit(1); }
  const data = [...(d1 || []), ...(d2 || [])];
  const error = null;
  if (error) { console.error('Erreur inattendue'); process.exit(1); }

  const emails = [...new Set(data.map(r => r.email.trim().toLowerCase()))];
  console.log(`${emails.length} adresse(s) trouvée(s). Envoi en cours…\n`);

  let ok = 0, ko = 0;
  for (const email of emails) {
    const { error: err } = await tl.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: 'https://tilawatour.jumuaandme.workers.dev/'
      }
    });
    if (err) {
      console.error(`  ✗ ${email}  →  ${err.message}`);
      ko++;
    } else {
      console.log(`  ✓ ${email}`);
      ok++;
    }
    await delay(250);
  }

  console.log(`\nTerminé : ${ok} envoyé(s), ${ko} échec(s).`);
}

main();
