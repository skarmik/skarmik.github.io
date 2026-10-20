'use strict';

const API_URL = 'https://pokeapi.co/api/v2/pokemon-species?limit=1302';
const SPRITE_URL = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

const CLAVE_CACHE = 'pokedex:lista';
const TANDA_INICIAL = 36;
const TANDA_EXTRA = 60;

const lista = document.getElementById('lista');
const estado = document.getElementById('estado');
const buscador = document.getElementById('buscador');
const btnLimpiar = document.getElementById('btn-limpiar');
const sentinela = document.getElementById('sentinela');

let todos = [];
let visibles = [];
let renderizados = 0;
let observador = null;

async function cargar() {
  estado.classList.remove('error');
  estado.textContent = 'Cargando lista de Pokémon…';

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    todos = data.results
      .map((item) => ({
        id: Number(item.url.split('/').filter(Boolean).pop()),
        nombre: item.name,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    try {
      localStorage.setItem(CLAVE_CACHE, JSON.stringify(todos));
    } catch {}

    pintar();
  } catch (err) {
    console.warn('Fallo la red, intentando caché local:', err);
    const cache = localStorage.getItem(CLAVE_CACHE);
    if (cache) {
      todos = JSON.parse(cache);
      pintar();
    } else {
      lista.replaceChildren();
      estado.classList.add('error');
      estado.textContent = 'No se pudo cargar la lista y no hay copia local. ';
      const btn = document.createElement('button');
      btn.textContent = 'Reintentar';
      btn.addEventListener('click', cargar);
      estado.appendChild(btn);
    }
  }
}

function crearTarjeta(p) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.className = 'tarjeta';
  a.href = 'pokemon.html?id=' + p.id;

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.width = 84;
  img.height = 84;
  img.alt = '';
  img.src = SPRITE_URL(p.id);
  img.onerror = () => {
    const espacio = document.createElement('span');
    espacio.className = 'espacio-sprite';
    img.replaceWith(espacio);
  };

  const num = document.createElement('span');
  num.className = 'numero';
  num.textContent = 'N.º ' + String(p.id).padStart(4, '0');

  const nombre = document.createElement('span');
  nombre.className = 'nombre';
  nombre.textContent = p.nombre;

  a.append(img, num, nombre);
  li.append(a);
  return li;
}

function crearEsqueleto() {
  const li = document.createElement('li');
  li.className = 'tarjeta esqueleto';
  li.innerHTML =
    '<span class="espacio-sprite"></span><span class="numero">&nbsp;</span>' +
    '<span class="nombre">cargando…</span>';
  return li;
}

function pintarMas() {
  const fragmento = document.createDocumentFragment();
  const hasta = Math.min(renderizados + TANDA_EXTRA, visibles.length);

  for (let i = renderizados; i < hasta; i++) {
    fragmento.appendChild(crearTarjeta(visibles[i]));
  }
  renderizados = hasta;
  lista.appendChild(fragmento);
}

function pintar() {
  estado.hidden = true;
  visibles = todos;
  renderizados = 0;
  lista.replaceChildren();

  configurarObservador();
  pintarMas();
  filtrar();
}

function configurarObservador() {
  if (observador) observador.disconnect();

  observador = new IntersectionObserver((entradas) => {
    if (!entradas.some((e) => e.isIntersecting)) return;
    if (renderizados >= visibles.length) return;

    pintarMas();

    if (renderizados >= visibles.length) observador.disconnect();
  });
  observador.observe(sentinela);
}

let temporizador = null;

buscador.addEventListener('input', () => {
  clearTimeout(temporizador);
  temporizador = setTimeout(filtrar, 120);
});

btnLimpiar.addEventListener('click', () => {
  buscador.value = '';
  filtrar();
  buscador.focus();
});

function filtrar() {
  const q = buscador.value.trim().toLowerCase();
  btnLimpiar.hidden = !q;

  if (!observador) return;
  observador.disconnect();

  visibles = q
    ? todos.filter((p) => p.nombre.includes(q))
    : todos.slice();

  renderizados = 0;
  lista.replaceChildren();

  if (visibles.length === 0) {
    estado.hidden = false;
    estado.textContent = 'Sin resultados para «' + q + '»';
    return;
  }
  estado.hidden = true;

  pintarMas();
  if (renderizados < visibles.length) observador.observe(sentinela);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((err) => {
    console.warn('No se pudo registrar el service worker:', err);
  });
}

lista.replaceChildren();
for (let i = 0; i < TANDA_INICIAL; i++) lista.appendChild(crearEsqueleto());

const qInicial = new URLSearchParams(location.hash.slice(1)).get('q');
if (qInicial) buscador.value = qInicial;

cargar();
