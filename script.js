{
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const stage = $('#stage'), cam = $('#cam'), livro = $('#livro'), toggle = $('#toggle');
const pages = $$('.spread');
const nomes = ['ola', 'habilidades', 'pauliceia', 'audiovisual', 'dandara'];
const titulos = ['olá!', 'habilidades', 'pauliceia', 'audiovisual', 'dandara'];
const vp = $('#vp'), barra = $('#barra-mob'), cheiaEl = $('[data-if="cheiaAberta"]');

/* ---------- encaixe na tela ----------
   telas grandes: o palco 1440×900 inteiro escalado.
   celular/tablet em pé, celular deitado e janelas estreitas ("modo celular"):
   uma página do caderno por vez, ocupando a largura da tela; se a página
   ficar mais alta que a tela, ela rola na vertical. */
let lado = 'esq';
/* regiões [x, y, largura, altura] do palco que aparecem no modo celular
   (esq/dir = só a área com conteúdo de cada página, sem a margem do caderno) */
const REG = { capa: [495, 185, 425, 530], esq: [128, 70, 544, 770], dir: [718, 70, 554, 770], cheia: [150, 95, 1140, 710] };
const KMIN = 0.55;   // abaixo desta escala o caderno inteiro fica pequeno demais para ler
const ehMobile = () => {
  const W = innerWidth, H = innerHeight;
  return W < H || Math.min(W / 1440, H / 900) < KMIN;
};
const sizer = document.createElement('div');
sizer.id = 'sizer';
vp.appendChild(sizer);
let ultimaReg = '';
function fit() {
  const mob = ehMobile();
  document.documentElement.classList.toggle('mobile', mob);
  const W = vp.clientWidth || innerWidth, H = vp.clientHeight || innerHeight;
  if (!mob) {
    const k = Math.min(W / 1440, H / 900);
    stage.style.transformOrigin = '0 0';
    stage.style.transform = 'translate(' + ((W - 1440 * k) / 2) + 'px,' + ((H - 900 * k) / 2) + 'px) scale(' + k + ')';
    sizer.style.height = '0px';
    vp.scrollTop = 0;
    ultimaReg = '';
    return;
  }
  const areaH = Math.max(1, H - barra.offsetHeight);
  const qual = !cheiaEl.hidden ? 'cheia' : !aberto ? 'capa' : lado;
  const [x, y, w, h] = REG[qual];
  // capa e vídeo em tela cheia cabem inteiros; as páginas ocupam a largura e rolam se preciso
  const k = qual === 'capa' || qual === 'cheia' ? Math.min(W / w, areaH / h, 1.5) : Math.min(W / w, 1.15);
  const alto = h * k;
  const topo = alto < areaH ? (areaH - alto) / 2 : 0;
  stage.style.transformOrigin = '0 0';
  stage.style.transform = 'translate(' + ((W - w * k) / 2 - x * k) + 'px,' + (topo - y * k) + 'px) scale(' + k + ')';
  sizer.style.height = Math.ceil(Math.max(areaH, alto) + barra.offsetHeight) + 'px';
  const chave = qual + cur;
  if (chave !== ultimaReg) { vp.scrollTop = 0; ultimaReg = chave; }
  atualizaBarra();
}
function atualizaBarra() {
  if (!ehMobile()) return;
  const t = $('#mob-titulo'), p = $('#mob-pag');
  if (!aberto) { t.textContent = 'portfólio'; p.textContent = 'toque para abrir o caderno'; }
  else { t.textContent = titulos[cur]; p.textContent = 'página ' + (cur * 2 + (lado === 'esq' ? 1 : 2)) + ' de ' + pages.length * 2; }
  $('#mob-ant').disabled = !aberto;
  $('#mob-prox').setAttribute('aria-label', !aberto ? 'Abrir o caderno' : cur === pages.length - 1 && lado === 'dir' ? 'Fechar o caderno' : 'Próxima página');
}
let fitFrame = 0;
function agendaFit() {
  if (fitFrame) return;
  fitFrame = requestAnimationFrame(() => { fitFrame = 0; fit(); });
}
addEventListener('resize', agendaFit);
addEventListener('orientationchange', agendaFit);
if (window.visualViewport) window.visualViewport.addEventListener('resize', agendaFit);

const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
function bind(roots, v) {
  for (const r of roots) {
    if (!r) continue;
    // inclui a própria raiz (o player de tela cheia é passado como raiz e tem data-if)
    (r.matches('[data-if]') ? [r] : []).concat($$('[data-if]', r)).forEach(e => {
      const on = !!v[e.dataset.if];
      if (e.hidden === on) {
        e.hidden = !on;
        $$('video', e).forEach(x => {
          if (on) { try { x.currentTime = 0; } catch (_) {} const p = x.play(); if (p && p.catch) p.catch(() => {}); }
          else x.pause();
        });
      }
    });
    $$('[data-cls]', r).forEach(e => { const c = v[e.dataset.cls]; if (e.className !== c) e.className = c; });
    $$('[data-t]', r).forEach(e => { const t = String(v[e.dataset.t]); if (e.textContent !== t) e.textContent = t; });
    for (const a of ['src', 'alt', 'poster']) {
      $$('[data-b-' + a + ']', r).forEach(e => { const val = get(v, e.getAttribute('data-b-' + a)); if (e.getAttribute(a) !== val) e.setAttribute(a, val); });
    }
    $$('[data-bs]', r).forEach(e => e.dataset.bs.split('|').forEach(p => { const i = p.indexOf(':'); e.style.setProperty(p.slice(0, i), v[p.slice(i + 1)]); }));
  }
}
const playAll = r => $$('video', r).forEach(x => { if (x.closest('[hidden]')) return; const p = x.play(); if (p && p.catch) p.catch(() => {}); });
const pauseAll = r => $$('video', r).forEach(x => x.pause());

/* ---------- página 02: PC do audiovisual ---------- */
function Audiovisual(root, extra) {
  let s, ts = [];
  const later = (f, ms) => ts.push(setTimeout(f, ms));
  const limpa = () => { ts.forEach(clearTimeout); ts = []; };
  const reset = () => { s = { perto: false, cur: [290, 200], sel: -1, clique: false, jan: -1, pausado: false, cheia: -1 }; };
  const set = o => { Object.assign(s, o); render(); };
  /* cada pasta mostra um trecho (como um gif) e o cursor segue para a próxima, em loop */
  const alvo = [[44, 48], [44, 112], [44, 176]], dur = [7, 7, 7];
  const vids = [
    { src: 'assets/pauliceia.mp4', poster: 'assets/pau_poster.jpg' },
    { src: 'assets/animacao.mp4', poster: 'assets/anim_poster.jpg' },
    { src: 'assets/zumbi.mp4', poster: 'assets/zumbi_poster.jpg' }
  ];
  function ciclo() { limpa(); later(() => set({ perto: true }), 600); later(() => irPara(0), 2000); }
  function irPara(k) {
    set({ cur: alvo[k] });
    later(() => set({ sel: k, clique: true }), 1200);
    later(() => set({ jan: k, clique: false }), 1550);
    later(() => fim(k), 1550 + dur[k] * 1000);
  }
  function fim(k) {
    if (s.jan !== k) return;
    set({ jan: -1, sel: -1 });
    if (s.pausado) return;
    limpa();
    later(() => irPara((k + 1) % 3), 500);
  }
  function abrir(k) { limpa(); set({ pausado: true, perto: true, sel: k, jan: k, cur: [44, 48 + 64 * k] }); }
  const h = {
    abrir0: () => abrir(0), abrir1: () => abrir(1), abrir2: () => abrir(2),
    fim0: () => fim(0), fim1: () => fim(1), fim2: () => fim(2),
    cheia0: () => set({ cheia: 0 }), cheia1: () => set({ cheia: 1 }), cheia2: () => set({ cheia: 2 }),
    fecharCheia: () => set({ cheia: -1 }),
    pausar: () => {
      if (s.pausado) { set({ pausado: false, jan: -1, sel: -1, cur: [290, 200], perto: false }); ciclo(); }
      else { limpa(); set({ pausado: true }); }
    }
  };
  function vals() {
    const sb = k => (s.sel === k ? 'rgba(212,90,135,.35)' : 'transparent');
    return {
      pcCls: s.perto ? 'pc perto' : 'pc',
      cursorPos: 'translate(' + s.cur[0] + 'px,' + s.cur[1] + 'px)',
      clicando: s.clique, sel0: sb(0), sel1: sb(1), sel2: sb(2),
      jan0: s.jan === 0, jan1: s.jan === 1, jan2: s.jan === 2,
      rotuloPausa: s.pausado ? 'continuar animação' : 'pausar',
      cheiaAberta: s.cheia >= 0, cheio: s.cheia >= 0 ? vids[s.cheia] : vids[0]
    };
  }
  function render() { bind([root, extra], vals()); }
  reset(); render();
  return { h, render, show() { reset(); render(); ciclo(); }, hide() { limpa(); reset(); render(); } };
}

/* ---------- página 03: livro da Dandara ---------- */
function Dandara(root) {
  let s, ts = [], auto;
  const later = (f, ms) => ts.push(setTimeout(f, ms));
  const capas = ['assets/s78.jpg', 'assets/s1112.jpg', 'assets/s1314.jpg', 'assets/s1516.jpg', 'assets/s1920.jpg'];
  const n = capas.length;
  /* pré-carrega e decodifica as páginas para a folha não engasgar ao virar */
  capas.forEach(src => { const im = new Image(); im.src = src; if (im.decode) im.decode().catch(() => {}); });
  const reset = () => { s = { aberto: false, i: 0, vira: 0, pausado: false }; };
  const set = o => { Object.assign(s, o); render(); };
  const agenda = ms => { clearTimeout(auto); auto = setTimeout(passo, ms); };
  function virar() {
    if (s.vira) return;
    set({ vira: 1 });
    later(() => set({ vira: 2 }), 40);
    later(() => set({ i: s.i + 1, vira: 0 }), 960);
  }
  function fechar() { set({ aberto: false }); later(() => set({ i: 0 }), 1300); }
  function passo() {
    if (s.pausado) return;
    if (!s.aberto) { set({ aberto: true }); agenda(3200); }
    else if (s.i < n - 1) { virar(); agenda(3000); }
    else { fechar(); agenda(3400); }
  }
  const h = {
    pausar: () => { const p = !s.pausado; set({ pausado: p }); if (!p) agenda(800); else clearTimeout(auto); },
    anterior: () => { if (s.vira) return; if (s.aberto && s.i > 0) set({ i: s.i - 1 }); else if (s.aberto) fechar(); if (!s.pausado) agenda(4000); },
    proxima: () => { if (s.vira) return; if (!s.aberto) set({ aberto: true }); else if (s.i < n - 1) virar(); else fechar(); if (!s.pausado) agenda(4000); }
  };
  function vals() {
    const prox = capas[Math.min(s.i + 1, n - 1)];
    return {
      livroCls: s.aberto ? 'livro2 aberto' : 'livro2 fechado',
      esq: capas[s.i], dir: s.vira ? prox : capas[s.i],
      alt: 'Página dupla ' + (s.i + 1) + ' do livro Dandara Besourinha',
      virando: s.vira > 0, folhaCls: s.vira === 2 ? 'folha vira' : 'folha',
      fFrente: capas[s.i], fVerso: prox,
      contador: s.aberto ? 'página dupla ' + (s.i + 1) + '/' + n : 'capa',
      rotuloPausa: s.pausado ? 'continuar' : 'pausar'
    };
  }
  function render() { bind([root], vals()); }
  reset(); render();
  return { h, render, show() { reset(); render(); agenda(2200); }, hide() { ts.forEach(clearTimeout); ts = []; clearTimeout(auto); reset(); render(); } };
}

const simples = r => ({ h: {}, render() {}, show() { playAll(r); }, hide() { pauseAll(r); } });
const ctrls = [simples(pages[0]), simples(pages[1]), simples(pages[2]), Audiovisual(pages[3], $('[data-if="cheiaAberta"]')), Dandara(pages[4])];

/* ---------- caderno: abrir, fechar e virar ---------- */
let cur = Math.max(0, nomes.indexOf(location.hash.slice(1)));
let aberto = false, ocupado = false, autoT = null;
pages.forEach((p, i) => { p.hidden = i !== cur; });

function setNav() {
  $$('.tab').forEach((t, i) => { t.classList.toggle('ativa', i === cur); if (i === cur) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current'); });
  const ant = $('#anterior'), antTxt = $('#anterior-txt');
  ant.hidden = antTxt.hidden = cur === 0;
  const ultima = cur === pages.length - 1;
  $('#proxima-txt').textContent = ultima ? 'fechar caderno →' : 'virar a página →';
  $('#proxima').setAttribute('aria-label', ultima ? 'Fechar o caderno' : 'Virar para a próxima página');
  try { history.replaceState(null, '', '#' + nomes[cur]); } catch (_) {}
}

function abrir() {
  if (aberto) return;
  aberto = true; clearTimeout(autoT);
  livro.classList.remove('fechado'); livro.classList.add('aberto');
  cam.classList.add('perto');
  toggle.textContent = 'fechar caderno';
  $('#capa').setAttribute('aria-label', 'Caderno aberto');
  setTimeout(() => { if (aberto) ctrls[cur].show(); }, 900);
  fit();
}
function fechar() {
  if (!aberto || ocupado) return;
  aberto = false;
  ctrls[cur].hide();
  livro.classList.remove('aberto'); livro.classList.add('fechado');
  cam.classList.remove('perto');
  toggle.textContent = 'abrir caderno';
  $('#capa').setAttribute('aria-label', 'Abrir o caderno');
  if (cur !== 0) setTimeout(() => { if (!aberto) { pages[cur].hidden = true; cur = 0; pages[0].hidden = false; setNav(); } }, 1500);
  lado = 'esq';
  fit();
}

function face(clone, left, radius, verso) {
  const f = document.createElement('div');
  f.className = 'face' + (verso ? ' verso' : '');
  f.style.borderRadius = radius;
  clone.style.left = left + 'px';
  const sh = document.createElement('div');
  sh.className = 'sh';
  sh.style.background = 'linear-gradient(' + (verso ? 270 : 90) + 'deg, rgba(60,20,40,.45), rgba(60,20,40,0) 70%)';
  f.append(clone, sh);
  return f;
}
function irPara(j, frente) {
  if (!aberto) { cur = j; pages.forEach((p, i) => { p.hidden = i !== j; }); setNav(); abrir(); return; }
  if (ocupado || j === cur) return;
  ocupado = true;
  const fwd = frente === undefined ? j > cur : frente;
  const A = pages[cur], B = pages[j];
  ctrls[cur].hide();
  B.hidden = false; ctrls[j].render();
  const copia = el => {
    const c = el.cloneNode(true);
    c.removeAttribute('id'); c.hidden = false; c.className = 'clone';
    $$('[id]', c).forEach(x => x.removeAttribute('id'));
    const originais = [el, ...el.querySelectorAll('*')];
    const copiados = [c, ...c.querySelectorAll('*')];
    originais.forEach((original, i) => {
      const estilo = getComputedStyle(original);
      if (estilo.animationName !== 'none') {
        copiados[i].style.animation = 'none';
        copiados[i].style.transform = estilo.transform;
        copiados[i].style.opacity = estilo.opacity;
      }
    });
    $$('video', c).forEach(v => { const im = document.createElement('img'); im.src = v.getAttribute('poster') || ''; im.alt = ''; im.setAttribute('style', v.getAttribute('style') || ''); v.replaceWith(im); });
    return c;
  };
  const ca = copia(A), cb = copia(B);
  const L = 'inset(0 740px 0 0)', R = 'inset(0 0 0 700px)';
  A.style.clipPath = A.style.webkitClipPath = fwd ? L : R;
  B.style.clipPath = B.style.webkitClipPath = fwd ? R : L;
  const leaf = document.createElement('div');
  leaf.className = 'leaf ' + (fwd ? 'fwd' : 'back');
  leaf.append(
    face(ca, fwd ? -700 : -110, fwd ? '6px 26px 26px 6px' : '26px 6px 6px 26px', false),
    face(cb, fwd ? -110 : -700, fwd ? '26px 6px 6px 26px' : '6px 26px 26px 6px', true)
  );
  $('#flip').append(leaf);
  stage.classList.add('virando');
  /* espera as imagens da folha estarem decodificadas (máx. 250ms) e o navegador pintar,
     só então começa a girar — evita o engasgo no primeiro quadro */
  const decod = $$('img', leaf).map(im => (im.decode ? im.decode().catch(() => {}) : null));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const pronto = Promise.all([Promise.race([Promise.all(decod), espera(250)]), espera(120)]);
  pronto.then(() => requestAnimationFrame(() => requestAnimationFrame(() => {
    leaf.classList.add('go');
    setTimeout(() => {
      leaf.remove(); stage.classList.remove('virando');
      A.hidden = true; A.style.clipPath = A.style.webkitClipPath = '';
      B.style.clipPath = B.style.webkitClipPath = '';
      cur = j; setNav(); ctrls[j].show();
      fit();
      ocupado = false;
    }, 1260);
  })));
}

/* ---------- navegação no celular ---------- */
function mobProx() {
  if (!aberto) { lado = 'esq'; abrir(); return; }
  if (ocupado) return;
  if (lado === 'esq') { lado = 'dir'; fit(); }
  else { lado = 'esq'; if (cur === pages.length - 1) fechar(); else irPara(cur + 1, true); fit(); }
}
function mobAnt() {
  if (!aberto || ocupado) return;
  if (lado === 'dir') { lado = 'esq'; fit(); }
  else if (cur > 0) { lado = 'dir'; irPara(cur - 1, false); fit(); }
  else fechar();
}
$('#mob-prox').addEventListener('click', mobProx);
$('#mob-ant').addEventListener('click', mobAnt);
let toque = null;
vp.addEventListener('touchstart', e => { toque = e.touches.length === 1 ? [e.touches[0].clientX, e.touches[0].clientY] : null; }, { passive: true });
vp.addEventListener('touchend', e => {
  if (!toque || !ehMobile() || !cheiaEl.hidden) { toque = null; return; }
  const t = e.changedTouches[0], dx = t.clientX - toque[0], dy = t.clientY - toque[1];
  toque = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) { if (dx < 0) mobProx(); else mobAnt(); }
}, { passive: true });

stage.addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (go) { e.preventDefault(); if (!ocupado) lado = 'esq'; irPara(+go.dataset.go); fit(); return; }
  if (e.target.closest('#proxima')) { e.preventDefault(); if (cur === pages.length - 1) fechar(); else irPara(cur + 1, true); return; }
  if (e.target.closest('#anterior')) { e.preventDefault(); if (cur > 0) irPara(cur - 1, false); return; }
  if (e.target.closest('#capa')) { abrir(); return; }
  const act = e.target.closest('[data-act]');
  if (act) { const f = ctrls[cur].h[act.dataset.act]; if (f) { e.preventDefault(); f(); fit(); } }
});
toggle.addEventListener('click', () => { if (aberto) fechar(); else abrir(); });
document.addEventListener('ended', e => {
  const k = e.target.dataset && e.target.dataset.ended;
  if (k && ctrls[cur].h[k]) ctrls[cur].h[k]();
}, true);
document.addEventListener('keydown', e => {
  if (ehMobile() && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { if (e.key === 'ArrowRight') mobProx(); else mobAnt(); return; }
  if (e.key === 'ArrowRight' && aberto && cur < pages.length - 1) irPara(cur + 1, true);
  else if (e.key === 'ArrowRight' && aberto) fechar();
  else if (e.key === 'ArrowLeft' && aberto && cur > 0) irPara(cur - 1, false);
  else if (e.key === 'Escape') fechar();
});
addEventListener('hashchange', () => { const j = nomes.indexOf(location.hash.slice(1)); if (j >= 0 && j !== cur) irPara(j); });

setNav();
fit();
/* começa a entrada só depois de tudo carregado (ou 2,5s no máximo) */
let comecou = false;
function comecar() {
  if (comecou) return;
  comecou = true;
  document.documentElement.classList.add('pronto');
  autoT = setTimeout(abrir, 3600);
}
if (document.readyState === 'complete') comecar();
else { addEventListener('load', comecar); setTimeout(comecar, 2500); }
}
