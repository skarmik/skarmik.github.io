'use strict';

const COLORES_TIPO = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
  grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
  ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
  steel: '#B7B7CE', fairy: '#D685AD'
};

const NOMBRES_TIPO = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico',
  grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
  ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
  rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
  steel: 'Acero', fairy: 'Hada'
};

const NOMBRES_STAT = {
  hp: 'PS', attack: 'Ataque', defense: 'Defensa',
  'special-attack': 'At. Especial', 'special-defense': 'Def. Especial', speed: 'Velocidad'
};

const COLOR_STAT = {
  hp: '#FF5959', attack: '#F5AC78', defense: '#FAE078',
  'special-attack': '#9DB7F5', 'special-defense': '#A7DB8D', speed: '#FA9292'
};

const GENERACIONES = {
  'generation-i': '1.ª', 'generation-ii': '2.ª', 'generation-iii': '3.ª',
  'generation-iv': '4.ª', 'generation-v': '5.ª', 'generation-vi': '6.ª',
  'generation-vii': '7.ª', 'generation-viii': '8.ª', 'generation-ix': '9.ª'
};

const CRECIMIENTO = {
  slow: 'Lento', medium: 'Medio', fast: 'Rápido',
  'medium-slow': 'Medio-lento', 'slow-then-very-fast': 'Errático', 'fast-then-very-slow': 'Fluctuante'
};

const HABITATS = {
  cave: 'Cueva', forest: 'Bosque', grassland: 'Pradera', mountain: 'Montaña',
  rare: 'Raro', 'rough-terrain': 'Terreno abrupto', sea: 'Mar', urban: 'Urbano',
  'waters-edge': 'Orilla del agua', arctic: 'Ártico'
};

const HUEVOS = {
  monster: 'Monstruo', water1: 'Agua 1', water2: 'Agua 2', water3: 'Agua 3',
  bug: 'Bicho', flying: 'Volador', ground: 'Tierra', fairy: 'Hada', plant: 'Planta',
  humanshape: 'Humanoforme', mineral: 'Mineral', indeterminate: 'Indeterminado',
  field: 'Campo', dragon: 'Dragón', ditto: 'Ditto'
};

const NOMBRES_FORMA = {
  attack: 'Ataque', defense: 'Defensa', speed: 'Velocidad',
  mega: 'Mega', 'mega-x': 'Mega X', 'mega-y': 'Mega Y',
  primal: 'Primigenio', gmax: 'Gigamax',
  alola: 'de Alola', galar: 'de Galar', hisui: 'de Hisui', paldea: 'de Paldea',
  therian: 'Totémica', heat: 'Calor', wash: 'Lavado', frost: 'Frío',
  fan: 'Hélice', mow: 'Cortadora', white: 'Blanco', black: 'Negro',
  origin: 'Forma Origen', altered: 'Forma Alterada', sky: 'Forma Cielo',
  land: 'Forma Tierra', plant: 'Manto Planta', sandy: 'Manto Arenoso',
  trash: 'Manto Basura', baile: 'Paso Doble', 'pom-pom': 'Chulada',
  pau:'Paso Torcido', sensu: 'Paso Formal', overheated: 'Colusal', lowkick: 'Colalibre',
  'rapid-strike': 'Rápido Estilo', 'single-strike': 'Golpe Único',
  'red-striped': 'Franjas Rojas', 'blue-striped': 'Franjas Azules'
};

const URL_API = 'https://pokeapi.co/api/v2/';
const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
const LIMITE_FORMAS = 16;

const params = new URLSearchParams(location.search);
const id = parseInt(params.get('id'), 10);

const detalle = document.getElementById('detalle');
const ficha = document.getElementById('ficha');
const estado = document.getElementById('estado');
const seccionEvo = document.getElementById('seccion-evoluciones');
const buscador = document.getElementById('buscador');

let shiny = false;
let espece = null;
let formas = [];
let indiceForma = 0;
let listaHabilidades = [];

const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const decimal = (n) => n.toFixed(1).replace('.', ',');
const idDesdeUrl = (url) => Number(url.split('/').filter(Boolean).pop());

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

async function fetchJSONReintento(url) {
  try {
    return await fetchJSON(url);
  } catch {
    return fetchJSON(url);
  }
}

function textoEs(entradas) {
  const es = (entradas || []).filter((t) => t.language.name === 'es');
  if (es.length) return limpiarTexto(es[es.length - 1].flavor_text);
  const en = (entradas || []).filter((t) => t.language.name === 'en');
  return en.length ? limpiarTexto(en[en.length - 1].flavor_text) : '';
}

function limpiarTexto(s) {
  return (s || '').replace(/[\n\f\r]/g, ' ');
}

function nombreEs(obj) {
  const es = (obj.names || []).find((n) => n.language.name === 'es');
  return es ? es.name : capitalizar(obj.name);
}

function fila(etiqueta, valor) {
  return '<div><dt>' + etiqueta + '</dt><dd>' + valor + '</dd></div>';
}

function animadoDe(datos) {
  const v = datos.sprites.versions['generation-v'];
  return v && v['black-white'] && v['black-white'].animated ? v['black-white'].animated : {};
}

function srcPrincipal() {
  const anim = formas[indiceForma] ? formas[indiceForma].anim : {};
  if (anim.front_default) {
    return shiny ? (anim.front_shiny || anim.front_default) : anim.front_default;
  }
  const idForma = formas[indiceForma] ? formas[indiceForma].id : id;
  return SPRITES + (shiny ? 'shiny/' : '') + idForma + '.png';
}

function construirBrillo() {
  const puntos = new Set();
  for (let i = 1; i <= 11; i++) {
    puntos.add(i + ',6');
    puntos.add('6,' + i);
  }
  for (let f = 5; f <= 7; f++) {
    for (let c = 5; c <= 7; c++) puntos.add(f + ',' + c);
  }
  for (let k = 0; k < 3; k++) {
    puntos.add(2 + k + ',' + (2 + k));
    puntos.add(10 - k + ',' + (2 + k));
    puntos.add(2 + k + ',' + (10 - k));
    puntos.add(10 - k + ',' + (10 - k));
  }
  const rects = [...puntos]
    .map((p) => p.split(',').map(Number))
    .map(([x, y]) => '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>')
    .join('');
  return '<svg class="icono-brillo" viewBox="0 0 13 13" aria-hidden="true">' + rects + '</svg>';
}

const ICONO_BRILLO = construirBrillo();

function construirFlecha() {
  const puntos = new Set();
  for (let y = 5; y <= 7; y++) {
    for (let x = 5; x <= 12; x++) puntos.add(x + ',' + y);
  }
  for (let k = 0; k < 5; k++) {
    for (let y = 6 - k; y <= 6 + k; y++) puntos.add((1 + k) + ',' + y);
  }
  const rects = [...puntos]
    .map((p) => p.split(',').map(Number))
    .map(([x, y]) => '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>')
    .join('');
  return '<svg class="icono-flecha" viewBox="0 0 13 13" aria-hidden="true">' + rects + '</svg>';
}

function chipsDe(datos) {
  return datos.types
    .map((t) => '<span class="chip" style="background:' + (COLORES_TIPO[t.type.name] || '#888') + '">' +
      (NOMBRES_TIPO[t.type.name] || capitalizar(t.type.name)) + '</span>')
    .join('');
}

function barraStat(valor) {
  const paso = Math.round(valor / 255 * 10) * 10;
  return paso;
}

function pintarForma(e) {
  const forma = formas[indiceForma];
  const p = forma.datos;

  document.title = nombreEs(e) + ' · Pokédex';

  const conEtiqueta = forma.etiqueta
    ? ' <span class="forma-actual">' + forma.etiqueta + '</span>'
    : '';

  let genero = 'Sin género';
  if (e.gender_rate >= 0) {
    const machos = ((8 - e.gender_rate) / 8 * 100).toLocaleString('es');
    const hembras = (e.gender_rate / 8 * 100).toLocaleString('es');
    genero = '♂ ' + machos + ' % · ♀ ' + hembras + ' %';
  }

  const gruposHuevo = e.egg_groups
    .map((g) => HUEVOS[g.name] || capitalizar(g.name))
    .join(', ') || 'Desconocido';

  const genera = (e.genera || []).find((g) => g.language.name === 'es');
  const categoria = genera ? genera.genus : '—';

  const totalStats = p.stats.reduce((suma, s) => suma + s.base_stat, 0);

  const stats = p.stats.map((s) =>
    '<div class="stat">' +
      '<span class="stat-nombre">' + (NOMBRES_STAT[s.stat.name] || s.stat.name) + '</span>' +
      '<span class="stat-barra"><span class="stat-llenado" style="width:' + barraStat(s.base_stat) +
      '%;background:' + (COLOR_STAT[s.stat.name] || '#888') + '"></span></span>' +
      '<span class="stat-valor">' + s.base_stat + '</span>' +
    '</div>'
  ).join('') +
    '<div class="stat stat-total">' +
      '<span class="stat-nombre">Total</span>' +
      '<span class="stat-barra"></span>' +
      '<span class="stat-valor">' + totalStats + '</span>' +
    '</div>';

  const etiquetaEspecial = e.is_legendary || e.is_mythical
    ? '<span class="etiqueta-especial">' + (e.is_mythical ? 'Mítico' : 'Legendario') + '</span>'
    : '';

  const dex = textoEs(e.flavor_text_entries);

  const stripFormas = formas.length > 1
    ? '<div class="formas">' + formas.map((f, i) =>
        '<button type="button" class="forma-btn' + (i === indiceForma ? ' activa' : '') +
        '" data-indice="' + i + '" title="' + (f.etiqueta || 'Forma normal') + '">' +
        '<img src="' + SPRITES + f.id + '.png" alt="" />' +
        '<span>' + (f.etiqueta ? capitalizar(f.etiqueta) : 'Normal') + '</span></button>'
      ).join('') + '</div>'
    : '';

  ficha.innerHTML =
    '<div class="ficha-cabecera">' +
      '<span class="ficha-num">N.º ' + String(id).padStart(4, '0') + '</span>' +
      '<h2>' + nombreEs(e) + conEtiqueta + etiquetaEspecial + '</h2>' +
      '<div class="chips">' + chipsDe(p) + '</div>' +
      '<p class="categoria">' + categoria + '</p>' +
      stripFormas +
    '</div>' +
    '<div class="ficha-cuerpo">' +
      '<div class="ficha-sprite">' +
        '<img id="sprite-principal" src="' + srcPrincipal() + '" alt="Sprite" width="96" height="96" />' +
        '<button id="btn-shiny" type="button" class="btn-shiny" aria-label="Ver shiny" title="Shiny">' +
          ICONO_BRILLO +
        '</button>' +
      '</div>' +
      '<div class="ficha-info">' +
        (dex ? '<p class="dex">&laquo;' + dex + '&raquo;</p>' : '') +
        '<dl class="datos">' +
          fila('Altura', decimal(p.height / 10) + ' m') +
          fila('Peso', decimal(p.weight / 10) + ' kg') +
          fila('Género', genero) +
          fila('Captura', e.capture_rate + ' / 255') +
          fila('Felicidad', e.base_happiness) +
          fila('Eclosión', '~' + ((e.hatch_counter + 1) * 255).toLocaleString('es') + ' pasos') +
          fila('Grupos de huevo', gruposHuevo) +
          fila('Crecimiento', CRECIMIENTO[e.growth_rate.name] || capitalizar(e.growth_rate.name)) +
          fila('Generación', GENERACIONES[e.generation.name] || e.generation.name) +
          (e.habitat ? fila('Hábitat', HABITATS[e.habitat.name] || capitalizar(e.habitat.name)) : '') +
        '</dl>' +
      '</div>' +
    '</div>' +
    '<div class="seccion"><h3>Estadísticas base</h3><div class="stats">' + stats + '</div></div>' +
    '<div class="seccion"><h3>Habilidades</h3><div id="habilidades" class="habilidades"><p class="cargando-seccion">Cargando…</p></div></div>';

  document.querySelectorAll('.forma-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.indice);
      if (i !== indiceForma) {
        indiceForma = i;
        pintarForma(e);
      }
    });
  });

  document.getElementById('btn-shiny').addEventListener('click', () => {
    shiny = !shiny;
    const btn = document.getElementById('btn-shiny');
    btn.classList.toggle('activa', shiny);
    btn.title = shiny ? 'Ver normal' : 'Ver shiny';
    document.getElementById('sprite-principal').src = srcPrincipal();
  });
}

async function cargarHabilidades(p) {
  const zona = document.getElementById('habilidades');
  if (!zona) return;
  try {
    const detalles = await Promise.all(
      p.abilities.map((a) => fetchJSON(a.ability.url).catch(() => null))
    );
    zona.innerHTML = p.abilities.map((a, i) => {
      const d = detalles[i];
      let nombre = capitalizar(a.ability.name.replace(/-/g, ' '));
      let texto = '';
      if (d) {
        const es = d.names.find((n) => n.language.name === 'es');
        if (es) nombre = es.name;
        texto = textoEs(d.flavor_text_entries);
      }
      return '<div class="habilidad">' +
        '<p class="habilidad-titulo"><strong>' + nombre + '</strong>' +
        (a.is_hidden ? '<span class="etiqueta">Oculta</span>' : '') + '</p>' +
        (texto ? '<p>' + texto + '</p>' : '') +
        '</div>';
    }).join('');
  } catch {
    zona.innerHTML = '<p class="cargando-seccion">Sin datos de habilidades.</p>';
  }
}

async function cargarFormas(e) {
  try {
    const nombreDefault = (e.varieties.find((v) => v.is_default) || e.varieties[0]).pokemon.name;
    const base = nombreDefault.replace(/-normal$/, '');
    const variedades = e.varieties.slice(0, LIMITE_FORMAS);
    const datos = await Promise.all(
      variedades.map((v) => fetchJSONReintento(v.pokemon.url).catch(() => null))
    );

    formas = [];
    for (let i = 0; i < variedades.length; i++) {
      const d = datos[i];
      if (!d) continue;
      let etiqueta = '';
      if (!variedades[i].is_default) {
        const nombreVar = variedades[i].pokemon.name;
        const sufijo = nombreVar.startsWith(base + '-') ? nombreVar.slice(base.length + 1) : nombreVar;
        etiqueta = NOMBRES_FORMA[sufijo] || capitalizar(sufijo.replace(/-/g, ' '));
      }
      formas.push({
        id: d.id,
        original: variedades[i].pokemon.name,
        esDefault: !!variedades[i].is_default,
        etiqueta,
        datos: d,
        anim: animadoDe(d)
      });
    }

    if (formas.length > 1 && formas.length < e.varieties.length) {
      const resto = e.varieties.length - formas.length;
      seccionEvo.insertAdjacentHTML('beforebegin',
        '<p class="aviso-formas">Otras ' + resto + ' formas no se muestran.</p>');
    }
  } catch {
    formas = [];
  }
}

async function cargarEvoluciones(e) {
  const zona = document.getElementById('evoluciones');
  if (!zona) return;
  try {
    const cadena = await fetchJSON(e.evolution_chain.url);
    const especies = [];
    (function recorrer(nodo) {
      especies.push(nodo.species);
      nodo.evolves_to.forEach(recorrer);
    })(cadena.chain);

    const fichas = await Promise.all(especies.map(async (es) => {
      const idNodo = idDesdeUrl(es.url);
      let nombre = capitalizar(es.name);
      try {
        const especie = await fetchJSON(URL_API + 'pokemon-species/' + idNodo + '/');
        nombre = nombreEs(especie);
      } catch {}
      return '<a class="evo' + (idNodo === id ? ' actual' : '') + '" href="pokemon.html?id=' + idNodo + '">' +
        '<img src="' + SPRITES + idNodo + '.png" alt="" loading="lazy" />' +
        '<span>' + nombre + '</span></a>';
    }));

    zona.innerHTML = fichas.join('<span class="evo-flecha">&rarr;</span>');
    seccionEvo.hidden = fichas.length < 2;
  } catch {
    seccionEvo.hidden = false;
    zona.innerHTML = '<p class="cargando-seccion">Sin datos de evolución.</p>';
  }
}

function mostrarError() {
  estado.hidden = false;
  estado.classList.add('error');
  estado.textContent = 'No se pudo cargar la ficha. ';
  const btn = document.createElement('a');
  btn.className = 'btn-reintentar';
  btn.href = 'index.html';
  btn.textContent = '← Volver a la lista';
  estado.appendChild(btn);
  ficha.hidden = true;
  seccionEvo.hidden = true;
}

async function iniciar() {
  if (!id || id < 1 || id > 10000) {
    mostrarError();
    return;
  }
  try {
    const [p, e] = await Promise.all([
      fetchJSON(URL_API + 'pokemon/' + id + '/'),
      fetchJSON(URL_API + 'pokemon-species/' + id + '/')
    ]);
    estado.hidden = true;

    await cargarFormas(e);

    if (formas.length === 0) {
      formas = [{ id: p.id, datos: p, anim: animadoDe(p) }];
    }

    const indiceDefault = formas.findIndex((f) => f.esDefault);
    indiceForma = indiceDefault >= 0 ? indiceDefault : 0;

    ficha.hidden = false;
    pintarForma(e);
    cargarHabilidades(formas[indiceForma].datos);
    cargarEvoluciones(e);
  } catch (err) {
    console.warn('Fallo al cargar la ficha:', err);
    mostrarError();
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

document.getElementById('flecha').innerHTML = construirFlecha();

buscador.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const q = buscador.value.trim();
    location.href = 'index.html' + (q ? '#q=' + encodeURIComponent(q) : '');
  }
});

iniciar();
