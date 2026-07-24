/* ════ UNA MESA · Detail screen · Stitch design system ════ */

/* ── Market detection (self-contained copy — see home.jsx for canonical version) ── */
function dtMarket() {
  try {
    const q = new URLSearchParams(window.location.search).get('market');
    if (q === 'uk' || q === 'en') return 'en';
    if (window.location.hostname.endsWith('.co.uk')) return 'en';
  } catch (_) {}
  return 'es';
}
const DT_LANG = dtMarket();
const DT_T = {
  es: {
    notFound: 'Restaurante no encontrado.',
    backToResults: 'Volver a resultados',
    featured: 'Destacado',
    availToday: 'Disponible hoy',
    matchSuffix: '% afinidad',
    comingSoonTitle: 'Próximamente',
    comingSoonBody: 'Este restaurante se está incorporando a Una Mesa — todavía no se puede reservar aquí.',
    menuVideoCta: 'Ver el menú en video',
    menuVideoLocked: 'Menú en video — próximamente para este restaurante',
    reviewsParen: n => '(' + n + ' reseñas)',
    address: 'Dirección',
    hours: 'Horario',
    phone: 'Teléfono',
    avgPrice: 'Precio medio',
    priceRange: r => {
      const sym = window.UM_CURRENCY_SYMBOL ? window.UM_CURRENCY_SYMBOL(r.currency) : '€';
      return r.price === '€€€' ? sym + '35–55' : sym + '18–30';
    } /* rango aproximado por nivel de precio, no un dato real por restaurante */,
    menuTab: 'Carta',
    reviewsTab: n => 'Reseñas (' + n + ')',
    reviewsCount: n => n + ' reseñas',
    bookTable: 'Reserva tu mesa',
    at: 'en ',
    depositPre: 'Depósito de ',
    depositAmountFn: r => (window.UM_CURRENCY_SYMBOL ? window.UM_CURRENCY_SYMBOL(r.currency) : '€') + (r.deposit || 10) + '/persona',
    depositPost: ' — se descuenta del total.',
    timesToday: 'Horarios disponibles hoy',
    noAvailability: 'Sin disponibilidad hoy. Prueba otra fecha.',
    chooseDateTime: 'Elegir fecha y hora'
  },
  en: {
    notFound: 'Restaurant not found.',
    backToResults: 'Back to results',
    featured: 'Featured',
    availToday: 'Available today',
    matchSuffix: '% match',
    comingSoonTitle: 'Coming soon',
    comingSoonBody: "This restaurant is joining Una Mesa — booking isn't available here yet.",
    menuVideoCta: 'Watch the video menu',
    menuVideoLocked: 'Video menu — coming soon for this restaurant',
    reviewsParen: n => '(' + n + ' reviews)',
    address: 'Address',
    hours: 'Hours',
    phone: 'Phone',
    avgPrice: 'Average price',
    priceRange: r => {
      const sym = window.UM_CURRENCY_SYMBOL ? window.UM_CURRENCY_SYMBOL(r.currency) : '£';
      return r.price === '€€€' ? sym + '35–55' : sym + '18–30';
    } /* approximate range by price tier, not real per-restaurant data */,
    menuTab: 'Menu',
    reviewsTab: n => 'Reviews (' + n + ')',
    reviewsCount: n => n + ' reviews',
    bookTable: 'Book your table',
    at: 'at ',
    depositPre: 'Deposit of ',
    depositAmountFn: r => (window.UM_CURRENCY_SYMBOL ? window.UM_CURRENCY_SYMBOL(r.currency) : '£') + (r.deposit || 10) + '/person',
    depositPost: ' — deducted from the total.',
    timesToday: 'Available times today',
    noAvailability: 'No availability today. Try another date.',
    chooseDateTime: 'Choose date and time'
  }
}[DT_LANG];
function DetailScreen({
  rid,
  back,
  favs,
  toggleFav,
  startBook
}) {
  const data = window.UM_DATA;
  const r = data.find(x => x.id === rid);
  const [tab, setTab] = useState('menu');

  // Registro de visita — un conteo simple, sin datos personales, para
  // poder mostrarle a un restaurante potencial cuánta gente ve su ficha.
  useEffect(() => {
    if (!r || !window.UMAuth) return;
    window.UMAuth.sb.from('venue_page_views').insert({
      venue_id: r.id
    }).then(() => {});
  }, [rid]);
  if (!r) return React.createElement('div', {
    className: 'wrap',
    style: {
      padding: '60px 0'
    }
  }, DT_T.notFound);
  const fav = favs.includes(r.id);
  const allTimes = [...(r.times.lunch || []), ...(r.times.dinner || [])];
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const filteredTimes = allTimes.filter(([t]) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m > currentMinutes + 30;
  });
  return React.createElement('div', {
    className: 'view'
  }, React.createElement('div', {
    className: 'wrap'
  }, /* ── Back button ── */
  React.createElement('div', {
    className: 'detail-back',
    onClick: back
  }, React.createElement(Icon, {
    name: 'chevL'
  }), DT_T.backToResults), /* ── Gallery: 2fr | 1fr 1fr bento grid ── */
  React.createElement('div', {
    className: 'gallery'
  }, React.createElement(Photo, {
    cz: r.cz,
    glyph: r.glyph,
    slotId: 'um-' + r.id + '-g0',
    className: 'g-main',
    photoUrl: (r.photo_urls || [])[0]
  }), React.createElement(Photo, {
    cz: {
      from: r.cz.to,
      to: r.cz.from
    },
    glyph: r.glyph,
    slotId: 'um-' + r.id + '-g1',
    photoUrl: (r.photo_urls || [])[1]
  }), React.createElement(Photo, {
    cz: r.cz,
    glyph: 'wine',
    slotId: 'um-' + r.id + '-g2',
    photoUrl: (r.photo_urls || [])[2]
  }), React.createElement(Photo, {
    cz: {
      from: r.cz.to,
      to: r.cz.from
    },
    glyph: 'pot',
    slotId: 'um-' + r.id + '-g3',
    photoUrl: (r.photo_urls || [])[3]
  }), React.createElement(Photo, {
    cz: r.cz,
    glyph: r.glyph,
    slotId: 'um-' + r.id + '-g4',
    photoUrl: (r.photo_urls || [])[4]
  })), /* ── Two-column layout: main · booking sidebar ── */
  React.createElement('div', {
    className: 'detail-layout'
  }, /* ═══════ Main column ═══════ */
  React.createElement('div', {
    className: 'detail-main'
  }, /* Eyebrow pills */
  React.createElement('div', {
    className: 'det-eyebrow'
  }, React.createElement('span', {
    className: 'detail-tag-pill'
  }, DT_T.featured), React.createElement('span', {
    className: 'det-avail-pill'
  }, React.createElement(Icon, {
    name: 'clock',
    style: {
      width: 11,
      height: 11,
      flexShrink: 0
    }
  }), DT_T.availToday), React.createElement('span', {
    className: 'det-match-pill'
  }, React.createElement(Icon, {
    name: 'sparkle',
    fill: 'currentColor',
    style: {
      width: 11,
      height: 11,
      flexShrink: 0
    }
  }), r.match + DT_T.matchSuffix)), /* Title + fav button */
  React.createElement('div', {
    className: 'detail-title'
  }, React.createElement('div', null, React.createElement('h1', {
    className: 'display'
  }, r.name), React.createElement('div', {
    className: 'detail-sub'
  }, React.createElement('span', {
    className: 'rt'
  }, React.createElement(Icon, {
    name: 'star',
    fill: 'currentColor'
  }), r.rating.toFixed(1)), React.createElement('span', {
    className: 'muted'
  }, DT_T.reviewsParen(r.reviews)), React.createElement('span', {
    className: 'dot-sep'
  }), React.createElement('span', null, r.cuisine), React.createElement('span', {
    className: 'dot-sep'
  }), React.createElement('span', null, r.price), React.createElement('span', {
    className: 'dot-sep'
  }), React.createElement('span', null, r.area))), React.createElement('button', {
    className: 'icon-btn' + (fav ? ' on' : ''),
    onClick: () => toggleFav(r.id),
    style: fav ? {
      background: 'var(--accent)',
      color: 'var(--on-accent)',
      borderColor: 'var(--accent)'
    } : null
  }, React.createElement(Icon, {
    name: 'heart',
    fill: fav ? 'currentColor' : 'none'
  }))), /* Tag pills */
  React.createElement('div', {
    className: 'detail-tags'
  }, r.tags.map((t, i) => React.createElement('span', {
    key: i,
    className: 'tagpill'
  }, t))), /* About */
  React.createElement('p', {
    className: 'det-about'
  }, r.about), /* ── Info block ── */
  React.createElement('div', {
    className: 'detail-block'
  }, React.createElement('div', {
    className: 'info-grid'
  }, React.createElement('div', {
    className: 'info-item'
  }, React.createElement(Icon, {
    name: 'pin'
  }), React.createElement('div', null, React.createElement('div', {
    className: 'k'
  }, DT_T.address), React.createElement('div', {
    className: 'v'
  }, r.address))), React.createElement('div', {
    className: 'info-item'
  }, React.createElement(Icon, {
    name: 'clock'
  }), React.createElement('div', null, React.createElement('div', {
    className: 'k'
  }, DT_T.hours), React.createElement('div', {
    className: 'v'
  }, r.hours))), React.createElement('div', {
    className: 'info-item'
  }, React.createElement(Icon, {
    name: 'bell'
  }), React.createElement('div', null, React.createElement('div', {
    className: 'k'
  }, DT_T.phone), React.createElement('div', {
    className: 'v'
  }, r.phone))), React.createElement('div', {
    className: 'info-item'
  }, React.createElement(Icon, {
    name: 'euro'
  }), React.createElement('div', null, React.createElement('div', {
    className: 'k'
  }, DT_T.avgPrice), React.createElement('div', {
    className: 'v'
  }, DT_T.priceRange(r)))))), /* ── Tabs: Carta / Reseñas ── */
  React.createElement('div', {
    className: 'detail-block'
  }, React.createElement('div', {
    className: 'det-tabs'
  }, React.createElement('button', {
    type: 'button',
    className: 'det-tab' + (tab === 'menu' ? ' on' : ''),
    onClick: () => setTab('menu')
  }, DT_T.menuTab), React.createElement('button', {
    type: 'button',
    className: 'det-tab' + (tab === 'revs' ? ' on' : ''),
    onClick: () => setTab('revs')
  }, DT_T.reviewsTab(r.reviews))), /* Menu */
  tab === 'menu' ? r.menu.map((sec, i) => React.createElement('div', {
    key: i,
    className: 'menu-sec'
  }, React.createElement('h4', null, sec.s), sec.items.map((it, j) => React.createElement('div', {
    key: j,
    className: 'menu-item'
  }, React.createElement('div', {
    className: 'mi-l'
  }, React.createElement('div', {
    className: 'mn'
  }, it[0]), it[1] ? React.createElement('div', {
    className: 'md'
  }, it[1]) : null), React.createElement('div', {
    className: 'mp'
  }, it[2])))))

  /* Reviews */ : React.createElement('div', null, React.createElement('div', {
    className: 'rev-summary'
  }, React.createElement('div', null, React.createElement('div', {
    className: 'rev-big display'
  }, r.rating.toFixed(1)), React.createElement(Stars, {
    value: r.rating,
    size: 18
  }), React.createElement('div', {
    className: 'muted',
    style: {
      fontSize: '13px',
      marginTop: '4px'
    }
  }, DT_T.reviewsCount(r.reviews)))), r.revs.map((rv, i) => React.createElement('div', {
    key: i,
    className: 'rev-card'
  }, React.createElement('div', {
    className: 'rev-head'
  }, React.createElement('span', {
    className: 'rev-av'
  }, rv[0][0]), React.createElement('div', null, React.createElement('div', {
    className: 'rev-name'
  }, rv[0]), React.createElement('div', {
    className: 'rev-date'
  }, rv[2])), React.createElement('span', {
    className: 'rev-stars-sm'
  }, React.createElement(Stars, {
    value: rv[1],
    size: 13
  }))), React.createElement('div', {
    className: 'rev-text'
  }, rv[3])))))), /* ═══════ Booking sidebar ═══════ */
  React.createElement('aside', null, React.createElement('div', {
    className: 'det-bw'
  }, /* Headline */
  React.createElement('h3', {
    className: 'det-bw-title'
  }, DT_T.bookTable), React.createElement('p', {
    className: 'det-bw-sub'
  }, DT_T.at, React.createElement('b', null, r.name)), /* Deposit note · coral */
  React.createElement('div', {
    className: 'det-bw-dep'
  }, React.createElement(Icon, {
    name: 'shield',
    style: {
      width: 16,
      height: 16,
      flexShrink: 0,
      marginTop: 1
    }
  }), React.createElement('span', null, DT_T.depositPre, React.createElement('b', null, DT_T.depositAmountFn(r)), DT_T.depositPost)),
  /* Available time slots — o el aviso de "próximamente" si el
     restaurante todavía no completó Stripe Connect. Se sigue
     mostrando en el listado (visibilidad para restaurantes
     potenciales), pero no se puede reservar hasta que conecte
     su cuenta de pago. */
  !r.stripeChargesEnabled ? React.createElement('div', {
    className: 'det-bw-coming-soon',
    style: {
      padding: '16px',
      background: '#F9F8F5',
      borderRadius: 12,
      textAlign: 'center'
    }
  }, React.createElement('p', {
    style: {
      fontWeight: 700,
      marginBottom: 6
    }
  }, DT_T.comingSoonTitle), React.createElement('p', {
    style: {
      fontSize: 14,
      color: '#777'
    }
  }, DT_T.comingSoonBody)) : React.createElement(React.Fragment, null, React.createElement('p', {
    className: 'det-bw-times-label'
  }, DT_T.timesToday), filteredTimes.length ? React.createElement('div', {
    className: 'det-bw-times-grid'
  }, filteredTimes.map(([t, st], i) => React.createElement('button', {
    key: i,
    type: 'button',
    className: 'det-tslot' + (st === 'few' ? ' few' : st === 'full' ? ' full' : ''),
    disabled: st === 'full',
    onClick: () => startBook(r.id, t)
  }, t))) : React.createElement('p', {
    className: 'muted',
    style: {
      fontSize: '14px',
      margin: '4px 0 14px'
    }
  }, DT_T.noAvailability), /* Primary CTA */
  React.createElement('button', {
    type: 'button',
    className: 'det-bw-cta',
    onClick: () => startBook(r.id, null)
  }, React.createElement(Icon, {
    name: 'cal',
    style: {
      width: 17,
      height: 17
    }
  }), DT_T.chooseDateTime))),
  /* Menú en video — servicio de pago aparte, deshabilitado si el
     restaurante no tiene acceso activo */
  r.menuVideoAccess ? React.createElement('a', {
    href: `/menu-video/?venue=${r.id}`,
    className: 'det-bw-cta',
    style: {
      marginTop: 12,
      textDecoration: 'none'
    }
  }, React.createElement(Icon, {
    name: 'play',
    fill: 'currentColor',
    style: {
      width: 17,
      height: 17
    }
  }), DT_T.menuVideoCta) : React.createElement('button', {
    type: 'button',
    className: 'det-bw-cta',
    disabled: true,
    style: {
      marginTop: 12,
      background: 'var(--line)',
      color: 'var(--muted)',
      cursor: 'not-allowed'
    },
    title: DT_T.menuVideoLocked
  }, React.createElement(Icon, {
    name: 'play',
    fill: 'currentColor',
    style: {
      width: 17,
      height: 17
    }
  }), DT_T.menuVideoCta)))));
}
Object.assign(window, {
  DetailScreen
});