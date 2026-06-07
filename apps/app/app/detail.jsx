/* ════ UNA MESA · Detail screen ════ */

function DetailScreen({ rid, back, favs, toggleFav, startBook }) {
  const data = window.UM_DATA;
  const r = data.find(x=>x.id===rid);
  const [tab, setTab] = useState('menu');
  if (!r) return React.createElement('div',{className:'wrap',style:{padding:'60px 0'}},'Restaurante no encontrado.');
  const fav = favs.includes(r.id);
  const allTimes = [...(r.times.lunch||[]), ...(r.times.dinner||[])];

  return React.createElement('div', { className:'view' },
    React.createElement('div', { className:'wrap' },
      React.createElement('div', { className:'detail-back', onClick:back },
        React.createElement(Icon,{name:'chevL'}), 'Volver a resultados'),
      /* gallery */
      React.createElement('div', { className:'gallery' },
        React.createElement(Photo,{ cz:r.cz, glyph:r.glyph, slotId:'um-'+r.id+'-g0', className:'g-main' }),
        React.createElement(Photo,{ cz:{from:r.cz.to,to:r.cz.from}, glyph:r.glyph, slotId:'um-'+r.id+'-g1' }),
        React.createElement(Photo,{ cz:r.cz, glyph:'wine', slotId:'um-'+r.id+'-g2' }),
        React.createElement(Photo,{ cz:{from:r.cz.to,to:r.cz.from}, glyph:'pot', slotId:'um-'+r.id+'-g3' }),
        React.createElement(Photo,{ cz:r.cz, glyph:r.glyph, slotId:'um-'+r.id+'-g4' })
      ),
      React.createElement('div', { className:'detail-layout' },
        /* main */
        React.createElement('div', { className:'detail-main' },
          React.createElement('div', { className:'detail-title' },
            React.createElement('div', null,
              React.createElement('h1', { className:'display' }, r.name),
              React.createElement('div', { className:'detail-sub' },
                React.createElement('span', { className:'rt' }, React.createElement(Icon,{name:'star',fill:'currentColor'}), r.rating.toFixed(1)),
                React.createElement('span',{className:'muted'},'('+r.reviews+' reseñas)'),
                React.createElement('span',{className:'dot-sep'}),
                React.createElement('span',null, r.cuisine),
                React.createElement('span',{className:'dot-sep'}),
                React.createElement('span',null, r.price),
                React.createElement('span',{className:'dot-sep'}),
                React.createElement('span',null, r.area)
              )
            ),
            React.createElement('button', { className:'icon-btn'+(fav?' on':''), onClick:()=>toggleFav(r.id),
              style: fav?{background:'var(--accent)',color:'var(--on-accent)',borderColor:'var(--accent)'}:null },
              React.createElement(Icon,{name:'heart', fill:fav?'currentColor':'none'}))
          ),
          React.createElement('div', { className:'detail-tags' },
            React.createElement('span',{className:'rc-match',style:{position:'static'}}, React.createElement(Icon,{name:'sparkle',fill:'currentColor'}), r.match+'% afinidad'),
            r.tags.map((t,i)=>React.createElement('span',{key:i,className:'tagpill'},t))),
          React.createElement('p', { className:'about', style:{margin:'4px 0 6px'} }, r.about),
          /* info */
          React.createElement('div', { className:'detail-block' },
            React.createElement('div', { className:'info-grid' },
              React.createElement('div',{className:'info-item'},React.createElement(Icon,{name:'pin'}),React.createElement('div',null,React.createElement('div',{className:'k'},'Dirección'),React.createElement('div',{className:'v'},r.address))),
              React.createElement('div',{className:'info-item'},React.createElement(Icon,{name:'clock'}),React.createElement('div',null,React.createElement('div',{className:'k'},'Horario'),React.createElement('div',{className:'v'},r.hours))),
              React.createElement('div',{className:'info-item'},React.createElement(Icon,{name:'bell'}),React.createElement('div',null,React.createElement('div',{className:'k'},'Teléfono'),React.createElement('div',{className:'v'},r.phone))),
              React.createElement('div',{className:'info-item'},React.createElement(Icon,{name:'euro'}),React.createElement('div',null,React.createElement('div',{className:'k'},'Precio medio'),React.createElement('div',{className:'v'}, r.price==='€€€'?'35–55€':'18–30€')))
            )
          ),
          /* tabs: menu / reviews */
          React.createElement('div', { className:'detail-block' },
            React.createElement('div', { className:'tabs' },
              React.createElement('div',{className:'tab'+(tab==='menu'?' on':''),onClick:()=>setTab('menu')},'Carta'),
              React.createElement('div',{className:'tab'+(tab==='revs'?' on':''),onClick:()=>setTab('revs')},'Reseñas ('+r.reviews+')')
            ),
            tab==='menu'
              ? r.menu.map((sec,i)=>React.createElement('div',{key:i,className:'menu-sec'},
                  React.createElement('h4',null,sec.s),
                  sec.items.map((it,j)=>React.createElement('div',{key:j,className:'menu-item'},
                    React.createElement('div',{className:'mi-l'},
                      React.createElement('div',{className:'mn'},it[0]),
                      it[1]?React.createElement('div',{className:'md'},it[1]):null),
                    React.createElement('div',{className:'mp'},it[2])))))
              : React.createElement('div', null,
                  React.createElement('div', { className:'rev-summary' },
                    React.createElement('div',null,
                      React.createElement('div',{className:'rev-big display'},r.rating.toFixed(1)),
                      React.createElement(Stars,{value:r.rating,size:18}),
                      React.createElement('div',{className:'muted',style:{fontSize:'13px',marginTop:'4px'}},r.reviews+' reseñas')
                    )
                  ),
                  r.revs.map((rv,i)=>React.createElement('div',{key:i,className:'rev-card'},
                    React.createElement('div',{className:'rev-head'},
                      React.createElement('span',{className:'rev-av'},rv[0][0]),
                      React.createElement('div',null,
                        React.createElement('div',{className:'rev-name'},rv[0]),
                        React.createElement('div',{className:'rev-date'},rv[2])),
                      React.createElement('span',{className:'rev-stars-sm'},React.createElement(Stars,{value:rv[1],size:13}))),
                    React.createElement('div',{className:'rev-text'},rv[3]))))
          )
        ),
        /* sticky booking widget */
        React.createElement('aside', null,
          React.createElement('div', { className:'book-widget' },
            React.createElement('div', { className:'bw-price' }, 'Reserva tu mesa en ', React.createElement('b',null,r.name)),
            React.createElement('div', { className:'bw-dep' },
              React.createElement(Icon,{name:'shield'}),
              React.createElement('span',null,'Depósito de 10€/persona — se descuenta del total de tu cuenta.')),
            React.createElement('div', { style:{fontSize:'12px',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--dim)',marginBottom:'9px'} }, 'Horarios disponibles hoy'),
            allTimes.length
              ? React.createElement('div', { className:'bw-times' },
                  allTimes.map(([t,st],i)=>React.createElement('button', {
                    key:i, className:'tslot'+(st==='few'?' few':st==='full'?' full':''),
                    disabled: st==='full', onClick:()=>startBook(r.id,t) }, t)))
              : React.createElement('p',{className:'muted',style:{fontSize:'14px',margin:'4px 0 14px'}},'Sin disponibilidad hoy. Prueba otra fecha.'),
            React.createElement('button', { className:'btn btn-acc btn-block btn-lg', onClick:()=>startBook(r.id,null) },
              React.createElement(Icon,{name:'cal'}), 'Elegir fecha y hora')
          )
        )
      )
    )
  );
}

Object.assign(window, { DetailScreen });
