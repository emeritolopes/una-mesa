/* ════ UNA MESA · Menu Video Screen ════
   Pantalla nueva — muestra el menú en video de un restaurante,
   organizado por categoría (entrantes, principales, etc.). Solo
   accesible si el restaurante tiene el servicio de pago activo
   (menu_video_access) — la RLS de menu_videos ya lo exige aparte, esto
   es solo la capa de presentación.
*/

/* ── Market detection (self-contained copy — see home.jsx for canonical version) ── */
function mvMarket() {
  try {
    const q = new URLSearchParams(window.location.search).get('market');
    if (q === 'uk' || q === 'en') return 'en';
    if (window.location.hostname.endsWith('.co.uk')) return 'en';
  } catch (_) {}
  return 'es';
}
const MV_T = {
  es: {
    back: '← Volver a la ficha',
    title: 'Menú en video',
    loading: 'Cargando…',
    notAvailable: 'Este restaurante todavía no tiene menú en video disponible.',
    empty: 'Este restaurante no ha subido ningún video todavía.'
  },
  en: {
    back: '← Back to profile',
    title: 'Video menu',
    loading: 'Loading…',
    notAvailable: "This restaurant doesn't have a video menu available yet.",
    empty: "This restaurant hasn't uploaded any videos yet."
  }
};
function MenuVideoScreen({
  rid,
  back
}) {
  const lang = mvMarket();
  const t = MV_T[lang];
  const data = window.UM_DATA;
  const r = data.find(x => x.id === rid);
  const [videos, setVideos] = useState(null); // null = cargando, [] = vacío, [...] = datos

  useEffect(() => {
    if (!r || !r.menuVideoAccess || !window.UMAuth) {
      setVideos([]);
      return;
    }
    window.UMAuth.sb.from('menu_videos').select('*').eq('venue_id', rid).order('sort_order').then(({
      data: rows
    }) => setVideos(rows || []));
  }, [rid]);
  if (!r) {
    return React.createElement('div', {
      className: 'wrap',
      style: {
        padding: '60px 0'
      }
    }, React.createElement('button', {
      onClick: back,
      style: {
        marginBottom: 20
      }
    }, t.back), React.createElement('p', null, t.notAvailable));
  }
  if (!r.menuVideoAccess) {
    return React.createElement('div', {
      className: 'wrap',
      style: {
        padding: '60px 0',
        textAlign: 'center'
      }
    }, React.createElement('button', {
      onClick: back,
      style: {
        marginBottom: 20
      }
    }, t.back), React.createElement('p', null, t.notAvailable));
  }

  // Agrupa por categoría, preservando el orden de aparición
  const byCategory = {};
  const categoryOrder = [];
  (videos || []).forEach(v => {
    if (!byCategory[v.category]) {
      byCategory[v.category] = [];
      categoryOrder.push(v.category);
    }
    byCategory[v.category].push(v);
  });
  return React.createElement('div', {
    className: 'wrap',
    style: {
      padding: '40px 0 80px'
    }
  }, React.createElement('button', {
    onClick: back,
    style: {
      marginBottom: 24,
      background: 'none',
      border: 'none',
      color: 'var(--accent)',
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, t.back), React.createElement('h1', {
    style: {
      fontFamily: 'Playfair Display, serif',
      fontSize: 28,
      marginBottom: 4
    }
  }, t.title), React.createElement('p', {
    style: {
      color: '#777',
      marginBottom: 32
    }
  }, r.name), videos === null ? React.createElement('p', null, t.loading) : videos.length === 0 ? React.createElement('p', {
    className: 'muted'
  }, t.empty) : categoryOrder.map(cat => React.createElement('div', {
    key: cat,
    style: {
      marginBottom: 40
    }
  }, React.createElement('h2', {
    style: {
      fontSize: 18,
      fontWeight: 700,
      marginBottom: 16,
      textTransform: 'capitalize'
    }
  }, cat), React.createElement('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 20
    }
  }, byCategory[cat].map(v => React.createElement('div', {
    key: v.id,
    style: {
      borderRadius: 12,
      overflow: 'hidden',
      background: '#F4EFE6'
    }
  }, React.createElement('video', {
    src: v.video_url,
    controls: true,
    playsInline: true,
    style: {
      width: '100%',
      aspectRatio: '9/16',
      objectFit: 'cover',
      display: 'block',
      background: '#000'
    }
  }), React.createElement('p', {
    style: {
      padding: '10px 12px',
      fontWeight: 600,
      fontSize: 14
    }
  }, v.dish_name)))))));
}