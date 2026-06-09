/* ─────────────────────────────────────────────────────────────
   Una Mesa BOH — Supabase singleton
   All modules use window.sb — client is created exactly once.
   ───────────────────────────────────────────────────────────── */
(function () {
  var SUPABASE_URL = 'https://rkaytcmyaaighozxatod.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYXl0Y215YWFpZ2hvenhhdG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDU2NDIsImV4cCI6MjA5NjQyMTY0Mn0.8zgAxW2q6JU_PySTQHBfBUHpxlDnz9UVLr6jm981x3s';
  window._supabaseInstance = window._supabaseInstance || window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window.sb = window._supabaseInstance;
})();
