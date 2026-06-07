/* ════ UNA MESA · Results screen (grid + filters + map) ════ */

function ResultsScreen({ query, openRest, favs, toggleFav, startBook }) {
  const data = window.UM_DATA;
  const [q, setQ] = useState(query || '');
  const [cuisines, setCuisines] = useState([]);
  const [prices, setPrices] = useState([]);
  const [tags, setTags] = useState([]);
  const [sort, setSort] = useState('match');
  const [hoverId, setHoverId] = useState(null);

  useEffect(()=>{ setQ(query||''); }, [query]);

  const allCuisines = [...new Set(data.map(r=>r.cuisine))];
  const allTags = [...new Set(data.flatMap(r=>r.tags))];

  const toggle = (arr,set,v)=> set(arr.includes(v)? arr.filter(x=>x!==v): [...arr,v]);

  let list = data.filter(r=>{
    const text = (q||'').toLowerCase().trim();
    const matchText = !text || [r.name,r.cuisine,r.area,...r.tags,...(r.kw||[])].join(' ').toLowerCase().includes(text);
    const matchCui = !cuisines.length || cuisines.includes(r.cuisine);
    const matchPrice = !prices.length || prices.includes(r.price);
    const matchTag = !tags.length || tags.some(t=>r.tags.includes(t));
    return matchText && matchCui && matchPrice && matchTag;
  });
  list = [...list].sort((a,b)=>{
    if (sort==='match') return b.match-a.match;
    if (sort==='rating') return b.rating-a.rating;
    if (sort==='price-lo') return a.price.length-b.price.length;
    if (sort==='price-hi') return b.price.length-a.price.length;
    return 0;
  });

  const FOpt = (label, arr, set) => React.createElement('div', {
    className:'fopt'+(arr.includes(label)?' on':''), onClick:()=>toggle(arr,set,label) },
    React.createElement('span',{className:'box'},React.createElement(Icon,{name:'check'})),
    React.createElement('span',null,label));

  return React.createElement('div', { className:'view' },
    React.createElement('div', { className:'wrap' },
      React.createElement('div', { className:'results-top' },
        React.createElement('div', { className:'results-bar' },
          React.createElement('h1', { className:'display' }, q ? '"'+q+'"' : 'Restaurantes en Vigo'),
          React.createElement('span', { className:'count' }, list.length+' sitios'),
          React.createElement('div', { className:'sortbar' },
            React.createElement('span',{className:'muted',style:{fontSize:'13px'}},'Ordenar:'),
            React.createElement('select', { value:sort, onChange:e=>setSort(e.target.value) },
              React.createElement('option',{value:'match'},'Afinidad IA'),
              React.createElement('option',{value:'rating'},'Mejor valorados'),
              React.createElement('option',{value:'price-lo'},'Precio: bajo'),
              React.createElement('option',{value:'price-hi'},'Precio: alto')
            )
          )
        ),
        /* AI search bar */
        React.createElement('div', { className:'aibanner', style:{marginBottom:'4px'} },
          React.createElement('div',{className:'ai-ico'},React.createElement(Icon,{name:'sparkle',fill:'currentColor'})),
          React.createElement('div', { className:'ai-tx' },
            React.createElement('h3', null, 'Conserje IA'),
            React.createElement('p', null, q ? ('Mostrando coincidencias para "'+q+'". Ordenadas por afinidad contigo.') : 'Resultados ordenados por afinidad con tu gusto, presupuesto y franja habitual.')),
          React.createElement('button', { className:'btn btn-soft', onClick:()=>{setCuisines([]);setPrices([]);setTags([]);setQ('');} }, 'Limpiar filtros')
        )
      ),
      React.createElement('div', { className:'results-layout' },
        /* filters */
        React.createElement('aside', { className:'filters' },
          React.createElement('div', { className:'fgroup' },
            React.createElement('h4', null, 'Cocina'),
            React.createElement('div', { className:'fopts' }, allCuisines.map(c=>React.createElement(React.Fragment,{key:c}, FOpt(c,cuisines,setCuisines))))
          ),
          React.createElement('div', { className:'fgroup' },
            React.createElement('h4', null, 'Precio'),
            React.createElement('div', { className:'fopts' }, ['€€','€€€'].map(p=>React.createElement(React.Fragment,{key:p}, FOpt(p,prices,setPrices))))
          ),
          React.createElement('div', { className:'fgroup' },
            React.createElement('h4', null, 'Ambiente'),
            React.createElement('div', { className:'fchips' },
              allTags.map(t=>React.createElement('span', { key:t, className:'chip'+(tags.includes(t)?' on':''),
                onClick:()=>toggle(tags,setTags,t) }, t)))
          )
        ),
        /* grid */
        React.createElement('div', null,
          list.length
            ? React.createElement('div', { className:'results-grid' },
                list.map(r=>React.createElement('div', {
                  key:r.id, onMouseEnter:()=>setHoverId(r.id), onMouseLeave:()=>setHoverId(null) },
                  React.createElement(RestaurantCard, { r, fav:favs.includes(r.id), onFav:toggleFav, onOpen:openRest, onBook:startBook, showMatch:sort==='match' }))))
            : React.createElement('div', { className:'empty' },
                React.createElement(Icon,{name:'search'}),
                React.createElement('p',null,'No encontramos sitios con esos filtros.'),
                React.createElement('button',{className:'btn btn-soft',style:{marginTop:'14px'},onClick:()=>{setCuisines([]);setPrices([]);setTags([]);setQ('');}},'Quitar filtros'))
        ),
        /* map */
        React.createElement('aside', { className:'mappanel' },
          React.createElement('div', { className:'map' },
            React.createElement('div',{className:'map-bg'}),
            React.createElement('div',{className:'map-water',style:{width:'70%',height:'34%',bottom:'-6%',left:'-8%'}}),
            React.createElement('div',{className:'map-water',style:{width:'40%',height:'26%',top:'-8%',right:'-6%'}}),
            React.createElement('div',{className:'map-road',style:{left:'18%',top:0,bottom:0,width:'3px'}}),
            React.createElement('div',{className:'map-road',style:{left:0,right:0,top:'46%',height:'3px'}}),
            React.createElement('div',{className:'map-road',style:{left:'62%',top:0,bottom:0,width:'3px'}}),
            React.createElement('div',{className:'map-road',style:{left:0,right:0,top:'74%',height:'3px',opacity:.4}}),
            list.map(r=>React.createElement('div', {
              key:r.id, className:'pin'+(hoverId===r.id?' on':''),
              style:{ left:r.coords.x+'%', top:r.coords.y+'%' },
              onMouseEnter:()=>setHoverId(r.id), onMouseLeave:()=>setHoverId(null),
              onClick:()=>openRest(r.id) },
              React.createElement('div',{className:'tip'}, r.name+' · '+r.rating.toFixed(1)+'★'),
              React.createElement('div',{className:'dot'}, React.createElement('b',null, r.price.length===3?'€€€':'€€'))
            )),
            React.createElement('div',{className:'map-note'},'Mapa ilustrativo · Vigo')
          )
        )
      )
    )
  );
}

Object.assign(window, { ResultsScreen });
