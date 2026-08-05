const SUPABASE_URL = 'https://qsvozaxqeamrdkmujoze.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_MknX65gfRMb8Ncxoe9rRyA_sfCcH_u2';
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
  if (!url) return url;
  const marker = '/storage/v1/object/public/';
  if (!url.includes(marker)) return url;
  return url.replace(marker, '/storage/v1/render/image/public/') + `?width=${width}&quality=80`;
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

