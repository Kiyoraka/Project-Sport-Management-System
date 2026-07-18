/* ============================================================
   admin.js — ArenaOne admin console logic
   Login gate, tab router, and all tab renders (dashboard,
   analysis, sport management, bookings, settings, help, more).
   ============================================================ */

(function () {
  'use strict';

  var A = window.ArenaData;
  var S = A.Store, D = A.date, SLOTS = A.SLOTS, SPORTS = A.SPORTS;

  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, cls) { var e = document.createElement(tag); if (cls) { e.className = cls; } return e; };
  var money = function (n) { return 'RM' + n; };
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  var slotLabel = function (id) { var s = SLOTS.filter(function (x) { return x.id === id; })[0]; return s ? s.label : ''; };
  var courtMap = function () { var m = {}; S.getCourts().forEach(function (c) { m[c.id] = c; }); return m; };

  var AUTH_KEY = 'arenaone.admin';
  var DEMO_EMAIL = 'admin@gmail.com';   // matches "admiN@gmail.com" case-insensitively
  var DEMO_PASS = 'admin123';

  var state = { tab: 'main', statusFilter: 'all' };

  var toastTimer;
  function toast(msg) {
    var host = $('toastHost');
    host.innerHTML = '<div class="toast"><span class="tick">✓</span>' + msg + '</div>';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { host.innerHTML = ''; }, 2400);
  }

  /* ---------- auth ---------- */
  function isAuthed() { try { return sessionStorage.getItem(AUTH_KEY) === '1'; } catch (e) { return false; } }

  function showApp() {
    $('loginModal').hidden = true;
    $('adminShell').hidden = false;
    $('sideVenue').textContent = S.getSettings().venueName;
    $('todayLong').textContent = D.fmtLong(D.today());
    setTab('main');
  }

  function showLogin() {
    $('adminShell').hidden = true;
    $('loginModal').hidden = false;
  }

  function submitLogin() {
    var email = $('loginEmail').value.trim().toLowerCase();
    var pass = $('loginPass').value;
    if (email === DEMO_EMAIL && pass === DEMO_PASS) {
      try { sessionStorage.setItem(AUTH_KEY, '1'); } catch (e) {}
      $('loginErr').hidden = true;
      showApp();
    } else {
      var err = $('loginErr');
      err.textContent = 'Wrong email or password. Use the demo credentials below.';
      err.hidden = false;
    }
  }

  function logout() {
    try { sessionStorage.removeItem(AUTH_KEY); } catch (e) {}
    $('loginEmail').value = '';
    $('loginPass').value = '';
    showLogin();
  }

  /* ---------- tab router ---------- */
  var TITLES = { main: 'Dashboard', analysis: 'Analysis', sports: 'Sport management', booking: 'Bookings', settings: 'Settings', help: 'Help', more: 'Account' };
  var SECTIONS = { main: 'tabMain', analysis: 'tabAnalysis', sports: 'tabSports', booking: 'tabBooking', settings: 'tabSettings', help: 'tabHelp', more: 'tabMore' };

  function setTab(tab) {
    state.tab = tab;
    Object.keys(SECTIONS).forEach(function (k) { $(SECTIONS[k]).hidden = k !== tab; });
    $('adminTitle').textContent = TITLES[tab];
    document.querySelectorAll('#sideNav .side-item').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === tab); });
    document.querySelectorAll('#adminNav .nav-item').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === tab); });
    render(tab);
    window.scrollTo(0, 0);
  }

  function render(tab) {
    if (tab === 'main') { renderDashboard(); }
    else if (tab === 'analysis') { renderAnalysis(); }
    else if (tab === 'sports') { renderSports(); }
    else if (tab === 'booking') { renderBookings(); }
    else if (tab === 'settings') { renderSettings(); }
    else if (tab === 'help') { renderHelp(); }
    else if (tab === 'more') { renderMore(); }
  }

  /* ---------- date windows ---------- */
  function lastNDays(n) {
    var arr = [];
    for (var i = n - 1; i >= 0; i--) { arr.push(D.dayOffset(-i)); }
    return arr;
  }

  /* ---------- DASHBOARD ---------- */
  function renderDashboard() {
    var todayISO = D.toISO(D.today());
    var bookings = S.getBookings();
    var todays = bookings.filter(function (b) { return b.day === todayISO && b.status !== 'cancelled'; });
    var revenueToday = todays.filter(function (b) { return b.status === 'confirmed'; }).reduce(function (s, b) { return s + b.amount; }, 0);
    var pending = bookings.filter(function (b) { return b.status === 'pending'; }).length;
    var activeCourts = S.getCourts().filter(function (c) { return c.status === 'active'; }).length;

    var cards = [
      { l: "Today's bookings", v: todays.length, sub: 'across all courts' },
      { l: 'Revenue today', v: money(revenueToday), sub: 'confirmed' },
      { l: 'Pending', v: pending, sub: 'awaiting confirm' },
      { l: 'Active courts', v: activeCourts, sub: 'of ' + S.getCourts().length + ' total' }
    ];
    renderStats($('statCards'), cards);

    var m = courtMap();
    var host = $('todayList');
    host.innerHTML = '';
    if (!todays.length) { $('todayEmpty').hidden = false; return; }
    $('todayEmpty').hidden = true;
    var rows = el('div', 'adm-rows');
    todays.forEach(function (b) {
      var c = m[b.courtId] || { label: b.courtId };
      var row = el('div', 'adm-row');
      row.innerHTML =
        '<div class="r-main"><span class="r-name">' + b.customer + '</span>' +
        '<div class="r-sub">' + c.label + ' · ' + slotLabel(b.slot) + '</div></div>' +
        '<div class="r-side"><span class="r-amount">' + money(b.amount) + '</span>' +
        '<span class="badge badge-' + b.status + '">' + cap(b.status) + '</span></div>';
      rows.appendChild(row);
    });
    host.appendChild(rows);
  }

  function renderStats(host, cards) {
    host.innerHTML = '';
    cards.forEach(function (s) {
      var c = el('div', 'stat');
      c.innerHTML = '<div class="l">' + s.l + '</div><div class="v">' + s.v + '</div><div class="sub">' + s.sub + '</div>';
      host.appendChild(c);
    });
  }

  /* ---------- ANALYSIS ---------- */
  function renderAnalysis() {
    var bookings = S.getBookings();
    var days = lastNDays(7);
    var dayISOs = days.map(function (d) { return D.toISO(d); });

    var perDay = dayISOs.map(function (iso) {
      return bookings.filter(function (b) { return b.day === iso && b.status === 'confirmed'; }).reduce(function (s, b) { return s + b.amount; }, 0);
    });
    var weekRevenue = perDay.reduce(function (s, v) { return s + v; }, 0);
    var weekSessions = bookings.filter(function (b) { return dayISOs.indexOf(b.day) >= 0 && b.status === 'confirmed'; }).length;
    var avgDay = Math.round(weekRevenue / 7);

    renderStats($('anaCards'), [
      { l: 'Revenue (7d)', v: money(weekRevenue), sub: 'confirmed' },
      { l: 'Sessions (7d)', v: weekSessions, sub: 'confirmed bookings' },
      { l: 'Avg / day', v: money(avgDay), sub: 'last 7 days' }
    ]);

    // revenue bars
    var maxRev = Math.max.apply(null, perDay.concat([1]));
    var rev = $('revBars');
    rev.innerHTML = '';
    days.forEach(function (d, i) {
      var col = el('div', 'rev-col');
      var h = Math.round((perDay[i] / maxRev) * 100);
      col.innerHTML =
        '<div class="rv">' + perDay[i] + '</div>' +
        '<div class="rev-bar" style="height:' + h + '%"></div>' +
        '<div class="rl">' + D.DOW[d.getDay()] + '</div>';
      rev.appendChild(col);
    });

    // per-court bars
    var counts = S.getCourts().map(function (c) {
      var n = bookings.filter(function (b) { return b.courtId === c.id && dayISOs.indexOf(b.day) >= 0 && b.status !== 'cancelled'; }).length;
      return { label: c.label, n: n };
    });
    var maxCount = Math.max.apply(null, counts.map(function (x) { return x.n; }).concat([1]));
    var cb = $('courtBars');
    cb.innerHTML = '';
    counts.forEach(function (x) {
      var row = el('div', 'court-bar-row');
      var w = Math.round((x.n / maxCount) * 100);
      row.innerHTML =
        '<div class="cbl">' + x.label + '</div>' +
        '<div class="court-track"><div class="court-fill" style="width:' + w + '%"></div></div>' +
        '<div class="cbc">' + x.n + '</div>';
      cb.appendChild(row);
    });
  }

  /* ---------- SPORT MANAGEMENT ---------- */
  function renderSports() {
    // sport select
    var sel = $('ncSport');
    if (!sel.options.length) {
      SPORTS.forEach(function (sp) { var o = el('option'); o.value = sp.name; o.textContent = sp.name; sel.appendChild(o); });
    }
    var courts = S.getCourts();
    $('courtCount').textContent = courts.length;
    var host = $('courtsList');
    host.innerHTML = '';
    var rows = el('div', 'adm-rows');
    courts.forEach(function (c) {
      var maint = c.status === 'maintenance';
      var row = el('div', 'court-row');
      row.innerHTML =
        '<div class="court-left">' +
          '<div class="court-ini">' + c.label.replace(/[^0-9]/g, '') + '</div>' +
          '<div><div class="cr-name">' + c.label + '</div><div class="cr-sub">' + c.sport + ' · ' + money(c.price) + ' / 2h</div></div>' +
        '</div>' +
        '<div class="court-actions">' +
          '<span class="badge ' + (maint ? 'badge-maint' : 'badge-active') + '">' + (maint ? 'Maintenance' : 'Active') + '</span>' +
          '<button class="btn-xs btn-maint" data-id="' + c.id + '">' + (maint ? 'Reactivate' : 'Maintenance') + '</button>' +
          '<button class="btn-xs btn-cancel btn-del" data-id="' + c.id + '">Delete</button>' +
        '</div>';
      rows.appendChild(row);
    });
    host.appendChild(rows);

    host.querySelectorAll('.btn-maint').forEach(function (b) {
      b.onclick = function () {
        var c = S.getCourt(b.getAttribute('data-id'));
        S.updateCourt(c.id, { status: c.status === 'maintenance' ? 'active' : 'maintenance' });
        toast('Court updated');
        renderSports();
      };
    });
    host.querySelectorAll('.btn-del').forEach(function (b) {
      b.onclick = function () {
        S.removeCourt(b.getAttribute('data-id'));
        toast('Court deleted');
        renderSports();
      };
    });
  }

  function addCourt() {
    var label = $('ncLabel').value.trim();
    var sport = $('ncSport').value;
    var priceRaw = $('ncPrice').value.trim();
    if (!label) { toast('Enter a court name'); return; }
    var price = priceRaw ? parseInt(priceRaw, 10) : A.priceForSport(sport);
    S.addCourt({ id: S.nextCourtId(), label: label, sport: sport, price: price, status: 'active' });
    $('ncLabel').value = '';
    $('ncPrice').value = '';
    toast('Court added');
    renderSports();
  }

  /* ---------- BOOKINGS ---------- */
  function renderBookings() {
    var chips = ['all', 'confirmed', 'pending', 'cancelled'];
    var host = $('statusChips');
    host.innerHTML = '';
    chips.forEach(function (st) {
      var chip = el('button', 'chip-sm' + (state.statusFilter === st ? ' active' : ''));
      chip.textContent = st === 'all' ? 'All' : cap(st);
      chip.onclick = function () { state.statusFilter = st; renderBookings(); };
      host.appendChild(chip);
    });

    var m = courtMap();
    var all = S.getBookings();
    var list = state.statusFilter === 'all' ? all : all.filter(function (b) { return b.status === state.statusFilter; });
    $('bookingCount').textContent = all.length;

    var wrap = $('adminBookings');
    wrap.innerHTML = '';
    if (!list.length) { $('adminEmpty').hidden = false; return; }
    $('adminEmpty').hidden = true;

    var rows = el('div', 'adm-rows');
    list.forEach(function (b) {
      var c = m[b.courtId] || { label: b.courtId };
      var when = D.fmtLong(new Date(b.day + 'T00:00:00')).replace(/, \d{4}$/, '') + ' · ' + slotLabel(b.slot);
      var row = el('div', 'adm-row');
      row.innerHTML =
        '<div class="r-main">' +
          '<div class="r-name">' + b.customer + ' <span class="r-ref">· ' + b.ref + '</span></div>' +
          '<div class="r-sub">' + c.label + ' · ' + when + '</div>' +
          '<div class="r-sub2">' + (b.phone || '—') + ' · ' + payLabel(b.pay) + '</div>' +
        '</div>' +
        '<div class="r-side">' +
          '<span class="r-amount">' + money(b.amount) + '</span>' +
          '<span class="badge badge-' + b.status + '">' + cap(b.status) + '</span>' +
          '<button class="btn-xs btn-confirm act-confirm" data-ref="' + b.ref + '">Confirm</button>' +
          '<button class="btn-xs btn-cancel act-cancel" data-ref="' + b.ref + '">Cancel</button>' +
        '</div>';
      rows.appendChild(row);
    });
    wrap.appendChild(rows);

    wrap.querySelectorAll('.act-confirm').forEach(function (b) {
      b.onclick = function () { S.updateBooking(b.getAttribute('data-ref'), { status: 'confirmed' }); toast('Booking confirmed'); renderBookings(); };
    });
    wrap.querySelectorAll('.act-cancel').forEach(function (b) {
      b.onclick = function () { S.updateBooking(b.getAttribute('data-ref'), { status: 'cancelled' }); toast('Booking cancelled'); renderBookings(); };
    });
  }

  function payLabel(id) {
    var map = { card: 'Card', fpx: 'FPX', wallet: 'eWallet', venue: 'Pay at venue' };
    return map[id] || id;
  }

  /* ---------- SETTINGS ---------- */
  function renderSettings() {
    var s = S.getSettings();
    $('setVenue').value = s.venueName;
    paintAutoConfirm(s.autoConfirm);
  }

  function paintAutoConfirm(on) {
    $('autoConfirmDot').classList.toggle('on', on);
    $('autoConfirmLabel').textContent = 'Auto-confirm bookings: ' + (on ? 'ON' : 'OFF');
  }

  function toggleAutoConfirm() {
    var s = S.getSettings();
    s.autoConfirm = !s.autoConfirm;
    S.setSettings(s);
    paintAutoConfirm(s.autoConfirm);
    toast('Auto-confirm ' + (s.autoConfirm ? 'on' : 'off'));
  }

  function saveSettings() {
    var s = S.getSettings();
    var name = $('setVenue').value.trim() || 'ArenaOne';
    s.venueName = name;
    S.setSettings(s);
    $('sideVenue').textContent = name;
    toast('Settings saved');
  }

  function resetData() {
    S.reset();
    try { localStorage.removeItem('arenaone.mine'); } catch (e) {}
    toast('Demo data reset');
    setTab('main');
  }

  /* ---------- HELP ---------- */
  var HELP = [
    { q: 'How do bookings work?', a: 'Customers pick a date and tap free slots on the landing page timetable, enter their details and pay. Each 2-hour session becomes a booking you can see under Bookings and on the dashboard.' },
    { q: 'How do I add a court?', a: 'Go to Sport management, fill the Add a court form (name, sport, and an optional price — leave it blank to use the sport default) and press Add court. It appears instantly on the public timetable.' },
    { q: 'Can I cancel or confirm a booking?', a: 'Yes — open the Bookings tab and use the Confirm or Cancel buttons on any booking. Cancelled slots are freed on the public timetable immediately.' },
    { q: 'What does maintenance mode do?', a: 'Setting a court to Maintenance blocks all of its slots on the public timetable (shown hatched and disabled) until you reactivate it.' },
    { q: 'How do I reset the demo?', a: 'Settings has a Reset demo data button that restores the default courts and clears every booking, so you can start a fresh demo.' }
  ];

  function renderHelp() {
    var host = $('helpList');
    if (host.children.length) { return; }
    HELP.forEach(function (h, i) {
      var d = el('details');
      if (i === 0) { d.open = true; }
      d.innerHTML = '<summary>' + h.q + '</summary><p>' + h.a + '</p>';
      host.appendChild(d);
    });
  }

  /* ---------- MORE (mobile) ---------- */
  function renderMore() {
    var items = [
      { label: 'Settings', tab: 'settings' },
      { label: 'Help', tab: 'help' },
      { label: 'Log out', action: 'logout' }
    ];
    var host = $('moreList');
    host.innerHTML = '';
    items.forEach(function (it) {
      var b = el('button', 'more-item');
      b.textContent = it.label;
      b.onclick = function () {
        if (it.tab) { setTab(it.tab); }
        else if (it.href) { window.location.href = it.href; }
        else if (it.action === 'logout') { logout(); }
      };
      host.appendChild(b);
    });
  }

  /* ---------- init ---------- */
  function init() {
    $('loginSubmit').onclick = submitLogin;
    $('loginPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') { submitLogin(); } });
    $('demoFill').onclick = function () {
      $('loginEmail').value = 'admin@gmail.com';
      $('loginPass').value = 'admin123';
      $('loginErr').hidden = true;
    };
    $('logoutBtn').onclick = logout;
    $('addCourt').onclick = addCourt;
    $('autoConfirmBtn').onclick = toggleAutoConfirm;
    $('saveSettings').onclick = saveSettings;
    $('resetData').onclick = resetData;
    $('gotoBookings').onclick = function () { setTab('booking'); };

    document.querySelectorAll('#sideNav .side-item').forEach(function (b) {
      b.onclick = function () { setTab(b.getAttribute('data-tab')); };
    });
    document.querySelectorAll('#adminNav .nav-item').forEach(function (b) {
      b.onclick = function () { setTab(b.getAttribute('data-tab')); };
    });

    if (isAuthed()) { showApp(); } else { showLogin(); }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }

})();
