/* ════ UNA MESA · Supabase Auth ════ */
(function () {
  const SUPA_URL = 'https://rkaytcmyaaighozxatod.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYXl0Y215YWFpZ2hvenhhdG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDU2NDIsImV4cCI6MjA5NjQyMTY0Mn0.8zgAxW2q6JU_PySTQHBfBUHpxlDnz9UVLr6jm981x3s';

  const sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);

  function formatNameFromEmail(email) {
    return email.split('@')[0]
      .split('.')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  /* Supabase auth user → app user shape { id, name, email } */
  function toAppUser(sbUser) {
    if (!sbUser) return null;
    const meta = sbUser.user_metadata || {};
    const explicit = (meta.name || meta.full_name || '').trim();
    const name = explicit
      ? explicit.charAt(0).toUpperCase() + explicit.slice(1)
      : formatNameFromEmail(sbUser.email);
    return { id: sbUser.id, name, email: sbUser.email };
  }

  async function signUp(email, password, name) {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { name: name || email.split('@')[0] } }
    });
    if (error) throw error;

    /* persist in customers table — non-fatal if it fails (RLS, table missing, etc.) */
    if (data.user) {
      try {
        await sb.from('customers').upsert(
          { id: data.user.id, email: data.user.email, name: name || data.user.email.split('@')[0] },
          { onConflict: 'id' }
        );
      } catch (_) {}
    }

    /* null means confirmation email sent, no session yet */
    if (!data.session) return null;
    return toAppUser(data.user);
  }

  async function signIn(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return toAppUser(data.user);
  }

  async function signOut() {
    const { error } = await sb.auth.signOut();
    if (error) throw error;
  }

  async function getUser() {
    const { data: { user } } = await sb.auth.getUser();
    return toAppUser(user);
  }

  function onAuthStateChange(callback) {
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      callback(event, session ? toAppUser(session.user) : null);
    });
    return subscription;
  }

  window.UMAuth = { signUp, signIn, signOut, getUser, onAuthStateChange };
})();
