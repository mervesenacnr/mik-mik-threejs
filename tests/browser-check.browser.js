(async () => {
  const results = [];
  const assert = (condition, name) => {
    if (!condition) throw Error(name);
    results.push(name);
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const app = window.__mikTest;
  app.start();
  const g = app.game;
  g.guestTimer = g.spawnTimer = 999;
  const x = g.player.x;
  dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight', bubbles: true }));
  await wait(350);
  dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight', bubbles: true }));
  assert(g.player.x > x + 0.8, 'ArrowRight moves mouse');
  const z = g.player.z;
  dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }));
  await wait(350);
  dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', bubbles: true }));
  assert(g.player.z < z - 0.8, 'WASD moves mouse');
  dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
  await wait(50);
  dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }));
  assert(g.player.dashLeft > 2, 'Space starts dash cooldown');
  dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
  await wait(50);
  const time = g.time;
  await wait(180);
  assert(g.time === time && g.state === 'paused', 'Escape freezes time');
  assert(
    document.querySelector('#modal').textContent.includes('Mesai bekleyebilir'),
    'Pause menu visible',
  );
  dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
  await wait(80);
  assert(g.time > time && g.state === 'playing', 'Escape resumes');
  await wait(250);
  const guest = g.spawnGuest(),
    t = g.tables[0];
  guest.state = 'seated';
  guest.x = t.x - 1.6;
  guest.z = t.z;
  t.state = 'order';
  g.player.x = t.x + 2;
  g.player.z = t.z;
  await wait(760);
  assert(t.state === 'cooking', 'Automatic proximity order');
  t.progress = 0.1;
  await wait(180);
  assert(t.state === 'ready', 'Automatic cooking');
  g.player.x = 0;
  g.player.z = -4.4;
  await wait(90);
  assert(g.carried.includes(0), 'Automatic kitchen collection');
  g.player.x = t.x + 2;
  g.player.z = t.z;
  await wait(100);
  assert(t.state === 'eating', 'Automatic serve');
  assert(app.view.props.has('food0:' + t.dish), 'Plate rendered');
  assert(app.view.actors.get('g' + guest.id).r.spoon.visible, 'Eating spoon animated');
  t.progress = 0.1;
  await wait(180);
  assert(g.served === 1 && g.money === 14, 'Meal payment exactly once');
  assert(
    app.view.effects.some((e) => e.type === 'coins'),
    'Coin collection animated',
  );
  await wait(950);
  assert(t.state === 'empty', 'Automatic cleaning');
  g.addXP('combat', 8);
  await wait(100);
  assert(g.state === 'upgrade', 'Separate combat XP opens upgrade');
  assert(document.querySelectorAll('.upgrade-card').length === 3, 'Three upgrade buttons');
  const selected = g.offers[0].id;
  document.querySelector('.upgrade-card').click();
  await wait(70);
  assert(g.state === 'playing' && g.slots.combat.includes(selected), 'Upgrade click grants weapon');
  assert(g.player.power > 0, 'Power animation active');
  g.wave = 3;
  const e = g.spawnEnemy(5);
  e.x = g.player.x + 4;
  e.z = g.player.z + 4;
  await wait(50);
  assert(app.view.actors.has('e' + e.id), 'Human 3D actor rendered');
  g.hurt(e, 99999);
  assert(e.hp > 0, 'Human survives first hit');
  g.hurt(e, 99999);
  assert(e.hp > 0, 'Human survives second hit');
  g.hurt(e, 99999);
  await wait(60);
  assert(
    app.view.effects.some((f) => f.type === 'death'),
    'Human death animation',
  );
  g.pause();
  await wait(50);
  const death = app.view.effects.find((f) => f.type === 'death'),
    rotation = death.n.rotation.z;
  await wait(150);
  assert(death.n.rotation.z === rotation, 'Death animation freezes during pause');
  assert(app.profile.storage === null, 'Tests isolated from real saves');
  return { results, count: results.length, render: app.performance() };
})();
