/* ════ UNA MESA · Booking flow ════ */

function BookingScreen({ rid, presetTime, presetParty, back, user, requireAuth, onConfirm }) {
  const data = window.UM_DATA;
  const r = data.find(x=>x.id===rid);
  // if the concierge already knew time + party, jump straight to the deposit step
  const startStep = (presetTime && presetParty) ? 3 : (presetTime ? 2 : 0);
  const today0 = new Date(2026,5,2);
  const [step, setStep] = useState(startStep); // 0 date,1 time,2 party,3 deposit,4 done
  const [day, setDay] = useState(startStep>0 ? today0 : null);
  const [time, setTime] = useState(presetTime || null);
  const [party, setParty] = useState(presetParty || 2);
  const [pay, setPay] = useState('card');
  const [notify, setNotify] = useState('email'); // email | sms
  const [confCode, setConfCode] = useState('');
  const [hold, setHold] = useState(360); // segundos que mantenemos la mesa (6:00)
  const [expired, setExpired] = useState(false);

  if (!r) return React.createElement('div',{className:'wrap',style:{padding:'60px 0'}},'Restaurante no encontrado.');

  // countdown: arrancamos a mantener la mesa al llegar al paso del depósito
  React.useEffect(()=>{
    if (step!==3) return;
    if (expired) return;
    if (hold<=0){ setExpired(true); return; }
    const id = setTimeout(()=>setHold(h=>h-1), 1000);
    return ()=>clearTimeout(id);
  }, [step, hold, expired]);
  const mmss = (s)=> Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
  const holdLow = hold<=60;

  // build next 14 days
  const today = today0;
  const dows = ['D','L','M','X','J','V','S'];
  const days = Array.from({length:14},(_,i)=>{ const d=new Date(today); d.setDate(today.getDate()+i); return d; });
  const allTimes = [...(r.times.lunch||[]), ...(r.times.dinner||[])];
  const deposit = party*10;

  const goStep = n => setStep(n);
  const confirm = () => {
    if (!user) { requireAuth(()=>finish()); return; }
    finish();
  };
  const finish = () => {
    const code = 'UM-'+Math.random().toString(36).slice(2,7).toUpperCase();
    setConfCode(code);
    const booking = {
      id:code, rid:r.id, name:r.name, cz:r.cz, glyph:r.glyph, area:r.area,
      day: day ? day.toISOString() : today.toISOString(),
      dayLabel: day ? (dows[day.getDay()]+' '+day.getDate()+'/'+(day.getMonth()+1)) : 'Hoy',
      time, party, deposit, status:'up', created:Date.now(), member: !!user, notify
    };
    onConfirm(booking);
    setStep(4);
  };

  const pipCount = 4;
  const Steps = React.createElement('div', { className:'steps-head' },
    Array.from({length:pipCount},(_,i)=>React.createElement('div',{key:i,className:'step-pip'+(i<=step?' done':'')},React.createElement('i'))));

  const RestRow = React.createElement('div', { className:'bk-rest' },
    React.createElement(Photo,{cz:r.cz,glyph:r.glyph}),
    React.createElement('div',null,
      React.createElement('div',{className:'bn'},r.name),
      React.createElement('div',{className:'bm'},r.cuisine+' · '+r.area)));

  let body;
  if (step===0) {
    body = React.createElement(React.Fragment, null,
      React.createElement('div',{className:'bk-h'},'¿Qué día?'),
      React.createElement('div',{className:'bk-sub'},'Elige la fecha de tu reserva.'),
      React.createElement('div',{className:'dow-row'}, ['L','M','X','J','V','S','D'].map(d=>React.createElement('span',{key:d},d))),
      React.createElement('div',{className:'daygrid'},
        days.slice(0,14).map((d,i)=>{
          const dow = d.getDay(); const isSel = day && d.toDateString()===day.toDateString();
          return React.createElement('div',{ key:i, className:'daycell'+(isSel?' on':''), onClick:()=>{ setDay(d); goStep(1); } },
            React.createElement('span',{className:'dn'}, d.getDate()),
            React.createElement('span',{className:'dw'}, dows[dow]));
        })),
      React.createElement('div',{className:'bk-actions'},
        React.createElement('button',{className:'btn btn-ghost',onClick:back},'Cancelar'),
        React.createElement('button',{className:'btn btn-acc',disabled:!day,onClick:()=>goStep(1)},'Continuar'))
    );
  } else if (step===1) {
    body = React.createElement(React.Fragment, null,
      React.createElement('div',{className:'bk-h'},'¿A qué hora?'),
      React.createElement('div',{className:'bk-sub'}, (day?(dows[day.getDay()]+' '+day.getDate()+'/'+(day.getMonth()+1)):'Hoy')+' · disponibilidad en tiempo real'),
      allTimes.length ? React.createElement('div',{className:'timegrid'},
        allTimes.map(([t,st],i)=>React.createElement('button',{
          key:i, className:'timecell'+(time===t?' on':'')+(st==='full'?' full':''), disabled:st==='full',
          onClick:()=>{ setTime(t); goStep(2); } },
          t, st==='few'?React.createElement('span',{className:'tag'},'Últimas'):null)))
        : React.createElement('p',{className:'muted'},'Sin horarios para ese día.'),
      React.createElement('div',{className:'bk-actions'},
        React.createElement('button',{className:'btn btn-ghost',onClick:()=>goStep(0)},'Atrás'),
        React.createElement('button',{className:'btn btn-acc',disabled:!time,onClick:()=>goStep(2)},'Continuar'))
    );
  } else if (step===2) {
    body = React.createElement(React.Fragment, null,
      React.createElement('div',{className:'bk-h'},'¿Cuántos sois?'),
      React.createElement('div',{className:'bk-sub'},'Número de comensales.'),
      React.createElement('div',{className:'partyrow'},
        React.createElement('button',{className:'party-btn',onClick:()=>setParty(Math.max(1,party-1))},'−'),
        React.createElement('div',null,
          React.createElement('div',{className:'party-n display'},party),
          React.createElement('div',{className:'party-lbl'}, party===1?'comensal':'comensales')),
        React.createElement('button',{className:'party-btn',onClick:()=>setParty(Math.min(12,party+1))},'+')),
      party>=9?React.createElement('p',{className:'muted',style:{textAlign:'center',fontSize:'13.5px'}},'Para grupos grandes podemos avisar al restaurante con antelación.'):null,
      React.createElement('div',{className:'bk-actions'},
        React.createElement('button',{className:'btn btn-ghost',onClick:()=>goStep(1)},'Atrás'),
        React.createElement('button',{className:'btn btn-acc',onClick:()=>goStep(3)},'Continuar'))
    );
  } else if (step===3) {
    body = React.createElement(React.Fragment, null,
      React.createElement('div',{className:'bk-h'},'Confirma y asegura tu mesa'),
      React.createElement('div',{className:'bk-sub dep-sub'},
        'Un pequeño depósito que se descuenta de tu cuenta final.',
        React.createElement('span',{className:'info-tip', tabIndex:0},
          React.createElement(Icon,{name:'info'}),
          React.createElement('span',{className:'info-pop'},
            React.createElement('b',null,'¿Por qué un depósito?'),
            'Porque "reservo y ya si eso aparezco" se había convertido en deporte nacional. Tranqui, no es un peaje: se ',
            React.createElement('b',null,'descuenta del total'),
            ' de tu cuenta al final. Solo lo pierdes si decides hacerte el fantasma y dejar la mesa vacía.'))),
      expired
        ? React.createElement('div',{className:'hold-timer expired'},
            React.createElement(Icon,{name:'clock'}),
            React.createElement('span',null,'Se acabó el tiempo de reserva. ',
              React.createElement('b',null,'Vuelve a elegir la hora'),' para asegurar tu mesa.'),
            React.createElement('button',{className:'hold-retry',onClick:()=>{ setHold(360); setExpired(false); goStep(1); }},'Reintentar'))
        : React.createElement('div',{className:'hold-timer'+(holdLow?' low':'')},
            React.createElement(Icon,{name:'clock'}),
            React.createElement('span',null,'Guardamos tu mesa durante ',
              React.createElement('b',{className:'hold-count'}, mmss(hold)),' minutos. Completa el depósito antes de que acabe.')),
      React.createElement('div',{className:'dep-box'},
        React.createElement('div',{className:'dep-row'},React.createElement('span',null,'Día'),React.createElement('span',{style:{fontWeight:700}}, day?(dows[day.getDay()]+' '+day.getDate()+'/'+(day.getMonth()+1)):'Hoy')),
        React.createElement('div',{className:'dep-row'},React.createElement('span',null,'Hora'),React.createElement('span',{style:{fontWeight:700}}, time||'—')),
        React.createElement('div',{className:'dep-row'},React.createElement('span',null,'Comensales'),React.createElement('span',{style:{fontWeight:700}}, party)),
        React.createElement('div',{className:'dep-row'},React.createElement('span',null,'Depósito (10€ × '+party+')'),React.createElement('span',{className:'amt'}, deposit+'€')),
        React.createElement('div',{className:'dep-row total'},React.createElement('span',null,'A pagar ahora'),React.createElement('span',{className:'amt'}, deposit+'€'))
      ),
      React.createElement('div',{className:'bw-dep',style:{marginBottom:'16px'}},
        React.createElement(Icon,{name:'shield'}),
        React.createElement('span',null,'No es un cargo extra: se descuenta del total de tu cuenta. Solo se retiene si dejas la mesa vacía sin avisar.')),
      React.createElement('div',{style:{fontSize:'12px',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--dim)',marginBottom:'8px'}},'¿Cómo quieres recibir la confirmación?'),
      React.createElement('div',{className:'pay-methods',style:{marginBottom:'18px'}},
        React.createElement('button',{className:'pay-m'+(notify==='email'?' on':''),onClick:()=>setNotify('email')},React.createElement(Icon,{name:'mail'}),'Correo'),
        React.createElement('button',{className:'pay-m'+(notify==='sms'?' on':''),onClick:()=>setNotify('sms')},React.createElement(Icon,{name:'phone'}),'SMS')),
      React.createElement('div',{style:{fontSize:'12px',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--dim)',marginBottom:'8px'}},'Método de pago'),
      React.createElement('div',{className:'pay-methods'},
        React.createElement('button',{className:'pay-m'+(pay==='card'?' on':''),onClick:()=>setPay('card')},React.createElement(Icon,{name:'card'}),'Tarjeta'),
        React.createElement('button',{className:'pay-m'+(pay==='bizum'?' on':''),onClick:()=>setPay('bizum')},React.createElement(Icon,{name:'euro'}),'Bizum')),
      React.createElement('div',{className:'bk-actions'},
        React.createElement('button',{className:'btn btn-ghost',onClick:()=>goStep(2)},'Atrás'),
        React.createElement('button',{className:'btn btn-acc',style:{flex:1},disabled:expired,onClick:confirm}, expired?'Tiempo agotado':(user?('Pagar '+deposit+'€ y reservar'):'Iniciar sesión y reservar')))
    );
  } else {
    body = React.createElement('div', { className:'confirm-card' },
      React.createElement('div',{className:'confirm-ico'},React.createElement(Icon,{name:'check'})),
      React.createElement('h2',{className:'display'},'¡Mesa confirmada!'),
      React.createElement('p',{className:'muted'},'Te esperamos en '+r.name+'. Te hemos enviado los detalles por '+(notify==='sms'?'SMS':'correo electrónico')+'.'),
      React.createElement('div',{className:'confirm-detail'},
        React.createElement('div',{className:'cd-row'},React.createElement('span',{className:'k'},'Reserva'),React.createElement('span',{className:'v'},confCode)),
        React.createElement('div',{className:'cd-row'},React.createElement('span',{className:'k'},'Restaurante'),React.createElement('span',{className:'v'},r.name)),
        React.createElement('div',{className:'cd-row'},React.createElement('span',{className:'k'},'Día y hora'),React.createElement('span',{className:'v'}, (day?(dows[day.getDay()]+' '+day.getDate()+'/'+(day.getMonth()+1)):'Hoy')+' · '+time)),
        React.createElement('div',{className:'cd-row'},React.createElement('span',{className:'k'},'Comensales'),React.createElement('span',{className:'v'}, party)),
        React.createElement('div',{className:'cd-row'},React.createElement('span',{className:'k'},'Depósito'),React.createElement('span',{className:'v',style:{color:'var(--accent)'}}, deposit+'€ · reembolsable')),
        React.createElement('div',{className:'cd-row'},React.createElement('span',{className:'k'},'Confirmación'),React.createElement('span',{className:'v'}, notify==='sms'?'Por SMS':'Por correo electrónico'))
      ),
      React.createElement('div',{className:'bk-actions',style:{justifyContent:'center'}},
        React.createElement('button',{className:'btn btn-ghost',onClick:back},'Volver al inicio'),
        React.createElement('button',{className:'btn btn-acc',onClick:()=>onConfirm._goProfile&&onConfirm._goProfile()},'Ver mis reservas'))
    );
  }

  return React.createElement('div', { className:'view' },
    React.createElement('div', { className:'booking' },
      step<4?Steps:null,
      React.createElement('div',{className:'bk-card'}, step<4?RestRow:null, body)
    )
  );
}

Object.assign(window, { BookingScreen });
