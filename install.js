'use strict';

const btnInstalar = document.getElementById('btn-instalar');
let eventoInstalar = null;

function construirIconoInstalar() {
  const puntos = new Set();
  for (let y = 1; y <= 4; y++) puntos.add('6,' + y);
  for (let y = 5; y <= 6; y++) {
    for (let x = 4; x <= 8; x++) puntos.add(x + ',' + y);
  }
  for (let x = 5; x <= 7; x++) puntos.add(x + ',7');
  puntos.add('6,8');
  for (let x = 2; x <= 10; x++) {
    puntos.add(x + ',10');
    puntos.add(x + ',11');
  }
  puntos.add('2,9');
  puntos.add('10,9');
  const rects = [...puntos]
    .map((p) => p.split(',').map(Number))
    .map(([x, y]) => '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>')
    .join('');
  return '<svg viewBox="0 0 13 13" aria-hidden="true">' + rects + '</svg>';
}

function actualizarBoton() {
  if (!btnInstalar) return;
  btnInstalar.hidden = !eventoInstalar;
  if (eventoInstalar) {
    btnInstalar.innerHTML = construirIconoInstalar() + '<span>Instalar</span>';
  }
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  eventoInstalar = e;
  actualizarBoton();
});

window.addEventListener('appinstalled', () => {
  eventoInstalar = null;
  if (btnInstalar) btnInstalar.hidden = true;
});

if (btnInstalar) {
  btnInstalar.addEventListener('click', async () => {
    if (!eventoInstalar) return;
    eventoInstalar.prompt();
    await eventoInstalar.userChoice;
    eventoInstalar = null;
    btnInstalar.hidden = true;
  });
}
