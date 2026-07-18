/* ============================================================
   landing.js — ArenaOne public booking page logic
   Render (this file): hero stats, filters, timetable grid,
   slot selection, selection bar, mobile tab switch.
   Booking modal + My-bookings are wired in the same file.
   ============================================================ */

(function () {
  'use strict';

  var A = window.ArenaData;
  var S = A.Store, D = A.date, SLOTS = A.SLOTS, SPORTS = A.SPORTS;

  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, cls) { var e = document.createElement(tag); if (cls) { e.className = cls; } return e; };
  var money = function (n) { return 'RM' + n; };

  /* ---------- state ---------- */
  var state = {
    dayISO: D.toISO(D.today()),
    sport: 'all',
    court: 'all',
    selected: {}   // key "courtId|slotId" -> { courtId, courtLabel, slotId, slotLabel, sport, price }
  };

  var MINE_KEY = 'arenaone.mine';
  function getMine() { try { return JSON.parse(localStorage.getItem(MINE_KEY)) || []; } catch (e) { return []; } }
  function addMine(ref) { var m = getMine(); if (m.indexOf(ref) < 0) { m.push(ref); localStorage.setItem(MINE_KEY, JSON.stringify(m)); } }

  /* ---------- hero stats ---------- */
  function renderHeroStats() {
    var courts = S.getCourts();
    var sports = {};
    courts.forEach(function (c) { sports[c.sport] = true; });
    var stats = [
      { v: courts.length, l: 'Courts' },
      { v: Object.keys(sports).length, l: 'Sports' },
      { v: '4.9', l: 'Avg rating' }
    ];
    var host = $('heroStats');
    host.innerHTML = '';
    stats.forEach(function (s) {
      var card = el('div', 'stat-card');
      card.innerHTML = '<div class="v">' + s.v + '</div><div class="l">' + s.l + '</div>';
      host.appendChild(card);
    });
  }

  /* ---------- day chips ---------- */
  function renderDayChips() {
    var host = $('dayChips');
    host.innerHTML = '';
    for (var i = 0; i < 7; i++) {
      (function (n) {
        var d = D.dayOffset(n);
        var iso = D.toISO(d);
        var chip = el('button', 'day-chip' + (iso === state.dayISO ? ' active' : ''));
        chip.innerHTML = '<span class="dow">' + D.DOW[d.getDay()] + '</span>' +
                         '<span class="dom">' + d.getDate() + '</span>' +
                         '<span class="mon">' + D.MON[d.getMonth()] + '</span>';
        chip.onclick = function () { state.dayISO = iso; state.selected = {}; renderAll(); };
        host.appendChild(chip);
      })(i);
    }
    var sel = D.dayOffset(daysFromToday(state.dayISO));
    $('dateLabel').textContent = D.fmtLong(sel);
  }

  function daysFromToday(iso) {
    var t = D.today();
    var d = new Date(iso + 'T00:00:00');
    return Math.round((d - t) / 86400000);
  }

  /* ---------- sport chips ---------- */
  function renderSportChips() {
    var host = $('sportChips');
    host.innerHTML = '';
    var sports = {};
    S.getCourts().forEach(function (c) { sports[c.sport] = true; });
    var list = ['all'].concat(Object.keys(sports));
    list.forEach(function (name) {
      var chip = el('button', 'chip' + (state.sport === name ? ' active' : ''));
      chip.textContent = name === 'all' ? 'All' : name;
      chip.onclick = function () { state.sport = name; state.selected = {}; renderAll(); };
      host.appendChild(chip);
    });
  }

  /* ---------- court filter ---------- */
  function renderCourtFilter() {
    var sel = $('courtFilter');
    sel.innerHTML = '<option value="all">All courts</option>';
    S.getCourts().forEach(function (c) {
      var o = el('option'); o.value = c.id; o.textContent = c.label + ' · ' + c.sport;
      sel.appendChild(o);
    });
    sel.value = state.court;
    sel.onchange = function () { state.court = sel.value; state.selected = {}; renderGrid(); renderSelBar(); };
  }

  /* ---------- grid ---------- */
  function gridCourts() {
    return S.getCourts().filter(function (c) {
      if (state.sport !== 'all' && c.sport !== state.sport) { return false; }
      if (state.court !== 'all' && c.id !== state.court) { return false; }
      return true;
    });
  }

  function renderGrid() {
    var grid = $('grid');
    var courts = gridCourts();
    grid.style.setProperty('--cols', '72px repeat(' + courts.length + ', minmax(122px, 1fr))');
    var inner = el('div', 'grid-inner');

    // header row
    var head = el('div', 'grid-row');
    var corner = el('div', 'grid-corner'); corner.textContent = 'TIME';
    head.appendChild(corner);
    courts.forEach(function (c) {
      var ch = el('div', 'court-head');
      ch.innerHTML = '<div class="ch-label">' + c.label + '</div>' +
                     '<div class="ch-sub">' + c.sport + ' · ' + money(c.price) + '</div>';
      head.appendChild(ch);
    });
    inner.appendChild(head);

    // slot rows
    var mine = getMine();
    SLOTS.forEach(function (slot) {
      var row = el('div', 'grid-row');
      var time = el('div', 'time-cell'); time.textContent = slot.label;
      row.appendChild(time);
      courts.forEach(function (court) {
        row.appendChild(buildCell(court, slot, mine));
      });
      inner.appendChild(row);
    });

    grid.innerHTML = '';
    grid.appendChild(inner);
  }

  function buildCell(court, slot, mine) {
    var key = court.id + '|' + slot.id;
    var st = S.cellState(court, state.dayISO, slot.id);
    var b = el('button', 'slot');

    if (st === 'maintenance') {
      b.className = 'slot slot-maint';
      b.disabled = true;
      b.innerHTML = '<span class="st">Maint</span><span class="ssub">unavailable</span>';
      return b;
    }
    if (st === 'booked') {
      var bk = S.bookingFor(court.id, state.dayISO, slot.id);
      var yours = bk && mine.indexOf(bk.ref) >= 0;
      b.className = 'slot ' + (yours ? 'slot-yours' : 'slot-booked');
      b.disabled = true;
      b.innerHTML = '<span class="st">' + (yours ? 'Yours' : 'Booked') + '</span>' +
                    '<span class="ssub">' + (yours ? bk.ref : 'taken') + '</span>';
      return b;
    }
    // available / selected
    var isSel = !!state.selected[key];
    b.className = 'slot ' + (isSel ? 'slot-selected' : 'slot-avail');
    b.innerHTML = '<span class="st">' + money(court.price) + '</span>' +
                  '<span class="ssub">' + (isSel ? 'Selected' : '2h') + '</span>';
    b.onclick = function () { toggleSlot(court, slot); };
    return b;
  }

  function toggleSlot(court, slot) {
    var key = court.id + '|' + slot.id;
    if (state.selected[key]) {
      delete state.selected[key];
    } else {
      state.selected[key] = {
        courtId: court.id, courtLabel: court.label,
        slotId: slot.id, slotLabel: slot.label,
        sport: court.sport, price: court.price
      };
    }
    renderGrid();
    renderSelBar();
  }

  /* ---------- selection bar ---------- */
  function selectedArray() { return Object.keys(state.selected).map(function (k) { return state.selected[k]; }); }
  function selTotal() { return selectedArray().reduce(function (sum, s) { return sum + s.price; }, 0); }

  function renderSelBar() {
    var arr = selectedArray();
    var bar = $('selBar');
    if (!arr.length) { bar.hidden = true; return; }
    bar.hidden = false;
    $('selSummary').textContent = arr.length + (arr.length === 1 ? ' slot' : ' slots') + ' · ' + money(selTotal());
  }

  function clearSel() { state.selected = {}; renderGrid(); renderSelBar(); }

  /* ---------- mobile tab switch ---------- */
  function switchTab(tab) {
    var items = document.querySelectorAll('#landNav .nav-item');
    items.forEach(function (it) { it.classList.toggle('active', it.getAttribute('data-tab') === tab); });
    if (tab === 'mine') { document.body.classList.add('show-mine'); renderMyBookings(); }
    else { document.body.classList.remove('show-mine'); }
    window.scrollTo(0, 0);
  }

  /* ---------- My bookings (defined here, detailed in booking flow) ---------- */
  function renderMyBookings() {
    var host = $('myBookings');
    var empty = $('myBookingsEmpty');
    var mine = getMine();
    var courts = {};
    S.getCourts().forEach(function (c) { courts[c.id] = c; });
    var rows = S.getBookings().filter(function (b) { return mine.indexOf(b.ref) >= 0; });
    if (!rows.length) { host.innerHTML = ''; empty.hidden = false; return; }
    empty.hidden = true;
    var list = el('div', 'mb-list');
    rows.forEach(function (b) {
      var c = courts[b.courtId] || { label: b.courtId };
      var slot = SLOTS.filter(function (s) { return s.id === b.slot; })[0] || { label: '' };
      var card = el('div', 'mb-card');
      card.innerHTML =
        '<div>' +
          '<div class="mb-court">' + c.label + '</div>' +
          '<div class="mb-when">' + D.fmtLong(new Date(b.day + 'T00:00:00')) + ' · ' + slot.label + '</div>' +
          '<div class="mb-ref">Ref ' + b.ref + '</div>' +
        '</div>' +
        '<div class="mb-right">' +
          '<span class="badge badge-' + b.status + '">' + cap(b.status) + '</span>' +
          '<div class="mb-amount">' + money(b.amount) + '</div>' +
        '</div>';
      list.appendChild(card);
    });
    host.innerHTML = '';
    host.appendChild(list);
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- toast ---------- */
  var toastTimer;
  function toast(msg) {
    var host = $('toastHost');
    host.innerHTML = '<div class="toast"><span class="tick">✓</span>' + msg + '</div>';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { host.innerHTML = ''; }, 2400);
  }

  /* ---------- render all ---------- */
  function renderAll() {
    renderDayChips();
    renderSportChips();
    renderCourtFilter();
    renderGrid();
    renderSelBar();
  }

  /* ---------- booking modal (implemented in Phase 2 Task 4) ---------- */
  var Booking = window.ArenaBooking = {
    open: function () {},
    close: function () {}
  };

  /* ---------- init ---------- */
  function init() {
    $('venueName').textContent = S.getSettings().venueName;
    $('footName').textContent = S.getSettings().venueName;
    renderHeroStats();
    renderAll();

    $('selClear').onclick = clearSel;
    $('selBook').onclick = function () { Booking.open(); };

    document.querySelectorAll('#landNav .nav-item').forEach(function (it) {
      it.onclick = function () { switchTab(it.getAttribute('data-tab')); };
    });

    // expose helpers the booking flow needs
    window.ArenaLanding = {
      state: state, money: money, selectedArray: selectedArray, selTotal: selTotal,
      clearSel: clearSel, renderGrid: renderGrid, renderSelBar: renderSelBar,
      renderMyBookings: renderMyBookings, addMine: addMine, toast: toast, $: $, el: el
    };
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }

})();
