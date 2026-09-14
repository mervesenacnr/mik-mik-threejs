import {
  CHARACTERS,
  FURS,
  CLOTHS,
  EYES,
  COSTUMES,
  DIFFICULTIES,
  ACHIEVEMENTS,
  TRAINING,
  PERKS,
  EVOLUTIONS,
  SINGLE,
  DISHES,
} from './config.js';
import { icon, dishIcon, customerPortrait } from './icons.js';
export class UI {
  constructor(profile, callbacks) {
    this.profile = profile;
    this.callbacks = callbacks;
    this.tab = 'crew';
    this.previewCharacter = null;
    this.menu = document.querySelector('#menu');
    this.hud = document.querySelector('#hud');
    this.modal = document.querySelector('#modal');
    this.markers = document.querySelector('#markers');
    this.toastTimer = 0;
    this.lastState = '';
    this.lastHud = '';
    this.markerNodes = new Map();
    document.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-action]');
      if (b && !b.disabled) this.click(b);
    });
    this.menuRender();
  }
  toast(text) {
    const n = document.querySelector('#toast');
    n.textContent = text;
    n.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => n.classList.remove('show'), 3200);
  }
  menuRender() {
    const p = this.profile,
      c = CHARACTERS.find((c) => c.id === (this.previewCharacter || p.character));
    this.menu.hidden = false;
    this.hud.hidden = true;
    this.markers.hidden = true;
    this.modal.hidden = true;
    let content = '';
    if (this.tab === 'crew')
      content = `<div class="characters">${CHARACTERS.map((ch) => `<button class="character ${c.id === ch.id ? 'selected' : ''} ${p.open(ch.unlock) ? '' : 'locked'}" data-action="character" data-value="${ch.id}" title="${p.open(ch.unlock) ? ch.detail : ACHIEVEMENTS.find((a) => a[0] === ch.unlock)?.[4] + ' · ' + (ch.unlock === 'service' ? '10 servis' : ch.unlock === 'hunter' ? '75 canavar' : '50 servis')}"><span class="char-badge">${icon(ch.id === 'tok' ? 'pan' : ch.id === 'zip' ? 'speed' : ch.id === 'nane' ? 'soup' : 'mouse')}</span><span><strong>${ch.name}</strong><small>${ch.role}</small></span>${!p.open(ch.unlock) ? icon('lock') : ''}</button>`).join('')}</div><p class="role-detail">${c.detail}${!p.open(c.unlock) ? ' · Görünüm önizlemesi; başarımla açılır.' : ''}</p>`;
    else if (this.tab === 'training')
      content = `<div class="wallet">${icon('coin')}<b>${p.wallet}</b> kalıcı bahşiş</div><div class="training">${TRAINING.map(([id, name, detail]) => `<div class="training-row">${icon(id)}<div><strong>${name}</strong><small>${detail} · ${p.training[id]}/5</small></div><button data-action="train" data-value="${id}" ${p.training[id] >= 5 || p.wallet < p.price(id) ? 'disabled' : ''}>${p.training[id] >= 5 ? 'MAX' : p.price(id) + ' ◈'}</button></div>`).join('')}</div>`;
    else
      content = `<div class="achievements">${ACHIEVEMENTS.map(([id, name, key, target, reward]) => `<div class="achievement ${p.open(id) ? 'done' : ''}">${icon(p.open(id) ? 'trophy' : key)}<div><strong>${name}</strong><small>${reward}</small><div class="progress"><i style="width:${Math.min(100, (p.stats[key] / target) * 100)}%"></i></div></div><span>${Math.min(target, p.stats[key])}/${target}</span></div>`).join('')}</div>`;
    this.menu.innerHTML = `<header class="brand"><div><div class="wordmark">${icon('mouse')}mik mik</div><small>Ember & Crumb</small></div><span class="engine">THREE.JS EDITION</span></header><div class="menu-grid"><div><p class="eyebrow">Küçük patiler. Büyük mesai.</p><h1>Bir tutam cesaret.<br><em>Bir tabak macera.</em></h1><p class="intro">Masalara yetiş, mutfağını büyüt, avluyu savun.<br>Sen yolunu seç. Minik şef gerisini halleder.</p><nav class="tabs" aria-label="Başlangıç ayarları">${[
      ['crew', 'Şefler'],
      ['training', 'Gelişim'],
      ['achievements', 'Başarımlar'],
    ]
      .map(
        ([id, name]) =>
          `<button class="tab ${this.tab === id ? 'active' : ''}" data-action="tab" data-value="${id}">${name}</button>`,
      )
      .join(
        '',
      )}</nav>${content}</div><aside class="studio"><div class="studio-top"><span>Şefinle tanış</span><strong>${c.name} · ${c.role}</strong></div><div class="portrait-wrap"><canvas id="portrait" aria-label="${c.name} üç boyutlu görünüm önizlemesi"></canvas></div>${[
      ['fur', 'Tüy', FURS],
      ['cloth', 'Kıyafet', CLOTHS],
    ]
      .map(
        ([key, label, colors]) =>
          `<div class="custom-row"><span>${label}</span>${colors.map(([name, color], i) => `<button class="swatch ${p[key] === i ? 'selected' : ''}" style="--swatch:${color}" data-action="custom" data-key="${key}" data-value="${i}" aria-label="${label}: ${name}" title="${name}"></button>`).join('')}</div>`,
      )
      .join(
        '',
      )}<div class="custom-row"><span>Göz</span>${EYES.map(([id, name]) => `<button class="eye ${p.eye === id ? 'selected' : ''}" data-action="custom" data-key="eye" data-value="${id}" aria-label="${name} göz" title="${name}"><i></i><i></i></button>`).join('')}</div><div class="custom-row"><span>Tarz</span><div class="costumes">${COSTUMES.map(([id, name, unlock]) => `<button class="costume ${p.costume === id ? 'selected' : ''}" data-action="custom" data-key="costume" data-value="${id}" ${!p.open(unlock) ? 'disabled' : ''}>${!p.open(unlock) ? icon('lock') : ''} ${name}</button>`).join('')}</div></div></aside></div><footer><div class="menu-bottom"><div><p class="eyebrow" style="margin:0">Mesaini seç</p><div class="difficulty">${DIFFICULTIES.map((d, i) => `<button class="${p.difficulty === i ? 'selected' : ''}" data-action="difficulty" data-value="${i}" ${!p.difficultyOpen(i) ? 'disabled' : ''}>${!p.difficultyOpen(i) ? icon('lock') : ''} ${d[0]}</button>`).join('')}</div></div><div class="launch"><button class="secondary" data-action="showcase">Görsel tur</button><button class="primary" data-action="start">Mesaiye başla ${icon('arrow')}</button></div></div><div class="controls"><span><kbd>W A S D</kbd> / <kbd>↑ ← ↓ →</kbd> hareket</span><span><kbd>SPACE</kbd> dash</span><span><kbd>ESC</kbd> duraklat</span><span>İşlemler ve saldırılar otomatik</span></div></footer>`;
    this.callbacks.portrait(document.querySelector('#portrait'), { ...p, character: c.id });
  }
  click(b) {
    const a = b.dataset.action,
      v = b.dataset.value,
      p = this.profile;
    if (a === 'tab') {
      this.tab = v;
      this.menuRender();
    }
    if (a === 'character') {
      this.previewCharacter = v;
      const c = CHARACTERS.find((c) => c.id === v);
      if (p.open(c.unlock)) p.choose('character', v);
      this.menuRender();
      this.callbacks.custom();
    }
    if (a === 'custom') {
      p.choose(b.dataset.key, ['fur', 'cloth'].includes(b.dataset.key) ? Number(v) : v);
      this.menuRender();
      this.callbacks.custom();
    }
    if (a === 'difficulty') {
      p.choose('difficulty', Number(v));
      this.menuRender();
    }
    if (a === 'train') {
      p.buy(v);
      this.menuRender();
    }
    if (a === 'start' || a === 'showcase') {
      this.callbacks.start(a === 'showcase');
      this.menu.hidden = true;
      this.hud.hidden = false;
      this.markers.hidden = false;
      this.lastState = '';
      this.toast(
        a === 'showcase'
          ? 'Görsel tur · Kayıt ve başarımları etkilemez.'
          : 'Masaya yaklaş → fırından al → masaya dön.',
      );
    }
    if (a === 'pause') this.callbacks.pause();
    if (a === 'choose') this.callbacks.choose(Number(v));
    if (a === 'menu') {
      this.callbacks.menu();
      this.previewCharacter = null;
      this.menuRender();
      this.lastState = '';
    }
    if (a === 'sound') {
      this.callbacks.sound();
      this.lastHud = '';
    }
    if (a === 'quality') {
      this.callbacks.quality();
      this.toast('Görüntü: ' + this.callbacks.qualityName());
    }
  }
  update(g, view, fps) {
    if (g.state === 'menu') return;
    this.hud.hidden = false;
    this.markers.hidden = false;
    const signature = [
      g.slots.kitchen.join(),
      g.slots.combat.join(),
      JSON.stringify(g.perks),
      g.level.kitchen,
      g.level.combat,
      g.money,
      Math.ceil(g.waveTime),
      g.wave,
      Math.ceil(g.health),
      Math.ceil(g.rep),
      g.carried.length,
      g.stats.capacity,
      this.callbacks.soundOn(),
    ].join('|');
    if (signature !== this.lastHud) {
      this.lastHud = signature;
      this.hud.innerHTML = `<div class="hud-top"><div class="loadouts">${['kitchen', 'combat']
        .map(
          (source) =>
            `<div class="loadout ${source}"><div class="xp-label">${icon(source === 'kitchen' ? 'plate' : 'knife')}<b>${g.level[source]}</b></div><div><div class="slots">${Array.from(
              { length: 6 },
              (_, i) => {
                const id = g.slots[source][i];
                return `<div class="slot ${id ? '' : 'empty'}" title="${id ? PERKS.find((p) => p.id === id).name + ' ' + (g.perks[id] || 0) : 'Boş yuva'}">${id ? icon(id) + `<span class="pips">${'<i></i>'.repeat(g.perks[id])}</span>` : ''}</div>`;
              },
            ).join(
              '',
            )}</div><div class="xp-track"><div class="xp-fill" id="xp-${source}"></div></div></div></div>`,
        )
        .join(
          '',
        )}</div><div class="clock-chip"><span class="wave">${g.wave} / 6</span>${icon('clock')}<b>${Math.floor(Math.ceil(g.waveTime) / 60)}:${String(Math.ceil(g.waveTime) % 60).padStart(2, '0')}</b></div><div class="hud-right"><span class="hud-stat" title="Mesai kazancı">${icon('coin')}${g.money}</span><span class="hud-stat" title="Restoran itibarı">${icon('heart')}${Math.ceil(g.rep)}</span><button class="round-btn" data-action="sound" aria-label="${this.callbacks.soundOn() ? 'Sesi kapat' : 'Sesi aç'}" title="Ses ${this.callbacks.soundOn() ? 'açık' : 'kapalı'}" style="opacity:${this.callbacks.soundOn() ? 1 : 0.6}">${icon('volume')}</button><button class="round-btn" data-action="pause" aria-label="Duraklat">${icon('pause')}</button></div></div><div class="hud-bottom"><div class="health">${icon('heart')}<div class="health-track"><div class="health-fill" id="health-fill"></div></div>${Math.ceil(g.health)}</div><div class="dash"><kbd>SPACE</kbd><div class="dash-track"><i id="dash-fill"></i></div></div><span class="carry" title="Taşınan tabaklar">${icon('plate')}${g.carried.length}/${g.stats.capacity}</span></div><span class="hud-help">WASD / ↑ ← ↓ → &nbsp; · &nbsp; ESC</span><span class="fps" id="fps"></span>${g.demo ? '<span class="demo-label">GÖRSEL TUR · KAYITSIZ</span>' : ''}`;
    }
    for (const s of ['kitchen', 'combat'])
      document.querySelector('#xp-' + s).style.width = (g.xp[s] / g.nextXP[s]) * 100 + '%';
    document.querySelector('#health-fill').style.width = (g.health / g.maxHealth) * 100 + '%';
    document.querySelector('#dash-fill').style.width =
      (1 - g.player.dashLeft / g.stats.dashCD) * 100 + '%';
    document.querySelector('#fps').textContent =
      `${Math.round(fps)} FPS · ${this.callbacks.qualityName()}`;
    const stateKey = g.state + ':' + g.offers.map((p) => p.id).join();
    if (stateKey !== this.lastState) {
      this.lastState = stateKey;
      this.modal.hidden = g.state === 'playing';
      if (g.state === 'upgrade') {
        this.modal.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-label="Geliştirme seçimi"><span class="eyebrow">${g.upgradeSource === 'combat' ? 'Avlunun gücü' : 'Mutfağın hüneri'} · Seviye ${g.level[g.upgradeSource]}</span><h2>Biraz daha güçlen.</h2><p>${g.between ? 'Yeni dalgadan önce bir geliştirme seç.' : 'Mesai durdu. Bir geliştirme seç.'}</p><div class="upgrade-grid">${g.offers.map((p, i) => `<button class="upgrade-card" data-action="choose" data-value="${i}">${icon(p.id)}<small>${EVOLUTIONS[p.id] ? 'EVRİM' : !g.perks[p.id] ? 'YENİ EŞYA' : `SEVİYE ${['I', 'II', 'III', 'IV'][g.perks[p.id] || 0]}`}</small><strong>${p.name}</strong><p>${p.description}</p></button>`).join('')}</div>${!g.offers.length ? '<button class="primary" data-action="choose" data-value="0">Devam et</button>' : ''}</div>`;
      }
      if (g.state === 'paused')
        this.modal.innerHTML = `<div class="modal-card pause-card" role="dialog" aria-modal="true" aria-label="Duraklatma menüsü"><span class="eyebrow">Bir nefeslik mola</span><h2>Mesai bekleyebilir.</h2><p>Restoran ve avlu duraklatıldı.</p><button class="primary" data-action="pause">${icon('play')} Devam et</button><button class="secondary" data-action="quality">${icon('settings')} Görüntü kalitesini değiştir</button><button class="secondary" data-action="menu">Başlangıca dön</button><p class="comparison-note">Bu mesai sona erer; kazanılmış kalıcı bahşişler korunur.</p></div>`;
      if (g.state === 'ended')
        this.modal.innerHTML = `<div class="modal-card pause-card" role="dialog" aria-modal="true" aria-label="Mesai sonucu">${icon(g.won ? 'trophy' : 'mouse')}<h2>${g.won ? 'Eline sağlık, şef!' : 'Yarın yine açığız.'}</h2><p>${g.won ? 'Avlu güvende. Mutfağın efsanesi büyüyor.' : g.health <= 0 ? 'Avlu bugün biraz kalabalıktı.' : 'Müşterileri fazla beklettik.'}</p><div class="summary-stats"><span>${icon('plate')}<b>${g.served}</b><small>Servis</small></span><span>${icon('knife')}<b>${g.kills}</b><small>Canavar</small></span><span>${icon('coin')}<b>${g.money}</b><small>Kazanç</small></span></div><button class="primary" data-action="menu">Başlangıca dön ${icon('arrow')}</button></div>`;
      if (!this.modal.hidden) this.modal.querySelector('button')?.focus();
    }
    this.updateMarkers(g, view);
    if (g.profile.notices.length) this.toast('Başarım açıldı · ' + g.profile.notices.shift());
  }
  updateMarkers(g, view) {
    const used = new Set(),
      list = [],
      edgePositions = [];
    for (const guest of g.guests) {
      if (!['seated', 'walking', 'queue'].includes(guest.state)) continue;
      const t = g.tables[guest.table],
        state = guest.state === 'seated' ? t.state : 'arriving';
      if (state === 'eating') continue;
      list.push({
        id: 'guest' + guest.id,
        x: guest.x,
        z: guest.z,
        y: 2.3,
        patience: guest.patience / guest.maxPatience,
        state,
        dish: guest.dish,
        kind: guest.kind,
      });
    }
    for (const t of g.tables)
      if (t.state === 'dirty')
        list.push({ id: 'dirty' + t.id, x: t.x, z: t.z, y: 2.1, patience: 1, state: 'dirty' });
    if (g.tables.some((t) => t.state === 'ready' && !g.carried.includes(t.id)))
      list.push({ id: 'stove', x: 0, z: -5.5, y: 2.4, patience: 1, state: 'stove' });
    for (const item of list) {
      used.add(item.id);
      let n = this.markerNodes.get(item.id);
      if (!n) {
        n = document.createElement('div');
        this.markers.append(n);
        this.markerNodes.set(item.id, n);
      }
      const pos = view.project(item.x, item.y, item.z),
        cx = view.width / 2,
        cy = view.height / 2;
      const top = 125,
        bottom = view.height - 95,
        left = 32,
        right = view.width - 32;
      const off = pos.x < left || pos.x > right || pos.y < top || pos.y > bottom;
      let x = pos.x,
        y = pos.y;
      if (off) {
        const dx = x - cx,
          dy = y - cy,
          scale = Math.min(
            dx > 0 ? (right - cx) / dx : dx < 0 ? (left - cx) / dx : Infinity,
            dy > 0 ? (bottom - cy) / dy : dy < 0 ? (top - cy) / dy : Infinity,
          );
        x = cx + dx * scale;
        y = cy + dy * scale;
        const horizontal = Math.abs(y - top) < 1 || Math.abs(y - bottom) < 1;
        const ox = x,
          oy = y;
        for (
          let attempt = 0;
          attempt < 20 && edgePositions.some((p) => Math.hypot(p.x - x, p.y - y) < 47);
          attempt++
        ) {
          const shift = Math.ceil((attempt + 1) / 2) * 49 * (attempt % 2 ? -1 : 1);
          if (horizontal) x = Math.max(left, Math.min(right, ox + shift));
          else y = Math.max(top, Math.min(bottom, oy + shift));
        }
        edgePositions.push({ x, y });
      }
      const key = [off, item.state, item.dish, item.kind].join();
      if (n.dataset.key !== key) {
        n.dataset.key = key;
        n.className = 'marker ' + (item.state === 'stove' ? 'station' : '');
        const sym =
          off && item.state !== 'dirty' && item.state !== 'stove'
            ? 'mouse'
            : item.state === 'order'
              ? 'order'
              : item.state === 'cooking'
                ? 'oven'
                : item.state === 'ready'
                  ? 'plate'
                  : item.state === 'dirty'
                    ? 'clean'
                    : item.state === 'stove'
                      ? 'oven'
                      : 'mouse';
        n.innerHTML = `<span class="inside">${sym === 'mouse' ? customerPortrait(item.kind) : icon(sym)}</span>${off && item.dish !== undefined ? `<span class="state-badge">${icon(item.state === 'order' ? 'order' : item.state === 'cooking' ? 'oven' : item.state === 'ready' ? 'plate' : 'clock')}</span>` : ''}${off ? '<span class="direction"></span>' : ''}${item.dish !== undefined ? `<span class="food-badge">${dishIcon(item.dish)}</span>` : ''}`;
        if (item.kind)
          n.querySelector('.inside').style.background = {
            vip: '#edcf82',
            student: '#d3dde8',
            regular: '#d4e1cc',
            normal: '#f8efd9',
          }[item.kind];
      }
      n.style.left = x + 'px';
      n.style.top = y + 'px';
      n.style.setProperty('--angle', Math.atan2(pos.y - cy, pos.x - cx) + 'rad');
      n.style.setProperty('--patience', Math.max(0, item.patience * 100) + '%');
      n.style.setProperty(
        '--patience-color',
        item.patience < 0.25 ? '#cf7057' : item.patience < 0.5 ? '#d9ae5e' : '#7fa68b',
      );
    }
    for (const [id, n] of this.markerNodes)
      if (!used.has(id)) {
        n.remove();
        this.markerNodes.delete(id);
      }
  }
}
