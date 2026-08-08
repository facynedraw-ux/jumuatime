const SUPABASE_URL = 'https://qsvozaxqeamrdkmujoze.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzdm96YXhxZWFtcmRrbXVqb3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMzgyMDUsImV4cCI6MjA5NTcxNDIwNX0.3n6D7gfxb7qNi24brfxc59qwG-g4cT0s0kRq5fbSE-o';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getSession() {
  const { data: { session } } = await _supabase.auth.getSession();
  return session;
}

async function isAdmin() {
  const session = await getSession();
  if (!session) return false;
  const { data } = await _supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  return data?.role === 'admin';
}

function thumbUrl(url, width = 600) {
  return url;
}

async function submitNewsletter(e) {
  e.preventDefault();
  const input = e.target.querySelector('input[type=email]');
  const email = (input?.value || '').trim().toLowerCase();
  const msgEl = document.getElementById('footer-nl-msg');
  const btn   = e.target.querySelector('button[type=submit]');
  if (!email) return;
  if (btn) btn.disabled = true;
  const { error } = await _supabase.from('email_subscribers').insert({ email, source: 'footer_newsletter' });
  if (error && error.code !== '23505') {
    if (msgEl) { msgEl.textContent = 'Erreur — réessayez.'; msgEl.style.color = '#F2A4B2'; msgEl.style.display = 'block'; }
    if (btn) btn.disabled = false;
    return;
  }
  e.target.innerHTML = '';
  if (msgEl) { msgEl.textContent = '✓ Merci ! Vous êtes inscrite.'; msgEl.style.color = '#EFC865'; msgEl.style.display = 'block'; }
}

function showToast(message, type = 'info') {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const colors = {
    info:    { bg: '#F5F0FA', border: '#9B7FA6', text: '#3D1F2D' },
    success: { bg: '#E8F0E8', border: '#5B8A5F', text: '#3D1F2D' },
    error:   { bg: '#FDE8EE', border: '#C96B8A', text: '#3D1F2D' },
  };
  const c = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.style.cssText = `
    position: fixed; bottom: max(90px, calc(70px + env(safe-area-inset-bottom)));
    left: 50%; transform: translateX(-50%);
    background: ${c.bg}; border: 1px solid ${c.border}; color: ${c.text};
    padding: 12px 20px; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    z-index: 9999; max-width: 320px; text-align: center;
    animation: toastIn 0.2s ease;
  `;
  toast.textContent = message;

  const style = document.createElement('style');
  style.textContent = `@keyframes toastIn { from { opacity:0; transform: translateX(-50%) translateY(10px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`;
  document.head.appendChild(style);

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

