/* ============================================================
   data.js — ArenaOne seed data + localStorage store layer
   Shared by index.html (landing) and admin.html (admin).
   No backend: everything lives in localStorage under arenaone.*
   ============================================================ */

(function (global) {
  'use strict';

  /* ---------- constants ---------- */

  // Sports catalogue with default 2-hour price (RM)
  var SPORTS = [
    { name: 'Badminton',    price: 40 },
    { name: 'Futsal',       price: 80 },
    { name: 'Basketball',   price: 60 },
    { name: 'Pickleball',   price: 45 },
    { name: 'Volleyball',   price: 55 },
    { name: 'Table Tennis', price: 30 }
  ];

  // Seven 2-hour sessions, 08:00 - 22:00
  var SLOTS = [
    { id: 's1', label: '08:00 – 10:00', start: '08:00' },
    { id: 's2', label: '10:00 – 12:00', start: '10:00' },
    { id: 's3', label: '12:00 – 14:00', start: '12:00' },
    { id: 's4', label: '14:00 – 16:00', start: '14:00' },
    { id: 's5', label: '16:00 – 18:00', start: '16:00' },
    { id: 's6', label: '18:00 – 20:00', start: '18:00' },
    { id: 's7', label: '20:00 – 22:00', start: '20:00' }
  ];

  var PAY_METHODS = [
    { id: 'card',   name: 'Credit / Debit card', desc: 'Visa, Mastercard' },
    { id: 'fpx',    name: 'FPX online banking',  desc: 'Maybank2u, CIMB Clicks & more' },
    { id: 'wallet', name: "Touch 'n Go eWallet", desc: 'Scan QR to pay' },
    { id: 'venue',  name: 'Pay at venue',        desc: 'Cash / card at the counter' }
  ];

  var KEYS = {
    courts:   'arenaone.courts',
    bookings: 'arenaone.bookings',
    settings: 'arenaone.settings',
    seq:      'arenaone.seq'
  };

  /* ---------- date helpers ---------- */

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function toISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }

  function dayOffset(n) { var d = today(); d.setDate(d.getDate() + n); return d; }

  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function fmtLong(d) { return DOW[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); }

  /* ---------- seed builders ---------- */

  function seedCourts() {
    return [
      { id: 'c1', label: 'Court 1', sport: 'Badminton',  price: 40, status: 'active' },
      { id: 'c2', label: 'Court 2', sport: 'Badminton',  price: 40, status: 'active' },
      { id: 'c3', label: 'Court 3', sport: 'Futsal',     price: 80, status: 'active' },
      { id: 'c4', label: 'Court 4', sport: 'Basketball', price: 60, status: 'active' },
      { id: 'c5', label: 'Court 5', sport: 'Pickleball', price: 45, status: 'maintenance' }
    ];
  }

  function seedSettings() {
    return { venueName: 'ArenaOne', autoConfirm: true };
  }

  // A spread of bookings across the last 7 days (for analytics) plus a few today.
  function seedBookings() {
    var t = today();
    var iso = function (n) { return toISO(dayOffset(n)); };
    var list = [
      // today
      { customer: 'Aina Rahman',   phone: '012-345 6789', email: 'aina@email.com',  players: 4, notes: 'Racket rental x2', courtId: 'c3', day: iso(0),  slot: 's2', pay: 'card',   status: 'confirmed' },
      { customer: 'Farid Hakim',   phone: '019-887 2231', email: '',                players: 2, notes: '',                courtId: 'c1', day: iso(0),  slot: 's4', pay: 'venue',  status: 'pending'   },
      { customer: 'Mei Ling',      phone: '016-220 8890', email: 'mei@email.com',   players: 6, notes: '',                courtId: 'c4', day: iso(0),  slot: 's6', pay: 'fpx',    status: 'confirmed' },
      // past week
      { customer: 'Suresh Kumar',  phone: '013-556 1200', email: '',                players: 4, notes: '',                courtId: 'c1', day: iso(-1), slot: 's3', pay: 'card',   status: 'confirmed' },
      { customer: 'Nurul Izzah',   phone: '017-901 4432', email: 'nurul@email.com', players: 2, notes: '',                courtId: 'c2', day: iso(-1), slot: 's5', pay: 'wallet', status: 'confirmed' },
      { customer: 'Daniel Tan',    phone: '011-2033 7788',email: '',                players: 8, notes: 'Coaching',         courtId: 'c3', day: iso(-2), slot: 's6', pay: 'fpx',    status: 'confirmed' },
      { customer: 'Priya Devi',    phone: '018-664 1290', email: '',                players: 4, notes: '',                courtId: 'c4', day: iso(-2), slot: 's2', pay: 'card',   status: 'cancelled' },
      { customer: 'Hafiz Omar',    phone: '012-778 5521', email: 'hafiz@email.com', players: 2, notes: '',                courtId: 'c1', day: iso(-3), slot: 's4', pay: 'venue',  status: 'confirmed' },
      { customer: 'Grace Wong',    phone: '016-334 9087', email: '',                players: 6, notes: '',                courtId: 'c3', day: iso(-3), slot: 's7', pay: 'card',   status: 'confirmed' },
      { customer: 'Amir Zaki',     phone: '019-112 3345', email: '',                players: 4, notes: '',                courtId: 'c2', day: iso(-4), slot: 's3', pay: 'fpx',    status: 'confirmed' },
      { customer: 'Lina Yusof',    phone: '017-556 8890', email: 'lina@email.com',  players: 2, notes: '',                courtId: 'c4', day: iso(-5), slot: 's5', pay: 'card',   status: 'confirmed' },
      { customer: 'Kavin Raj',     phone: '013-889 2201', email: '',                players: 4, notes: '',                courtId: 'c1', day: iso(-6), slot: 's6', pay: 'wallet', status: 'confirmed' }
    ];
    // Attach amount (court price) + ref + createdAt
    var courts = seedCourts();
    var byId = {};
    courts.forEach(function (c) { byId[c.id] = c; });
    var seq = 2040;
    return list.map(function (b) {
      var c = byId[b.courtId] || { price: 0 };
      seq += 1;
      b.amount = c.price;
      b.ref = 'BK-' + seq;
      b.createdAt = b.day;
      return b;
    });
  }

  /* ---------- localStorage plumbing ---------- */

  function read(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function write(key, val) {
    try { global.localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* private mode */ }
  }

  /* ---------- Store API ---------- */

  var Store = {
    // Ensure all keys exist; seed on first run.
    init: function () {
      if (!global.localStorage.getItem(KEYS.courts))   { write(KEYS.courts, seedCourts()); }
      if (!global.localStorage.getItem(KEYS.bookings)) { write(KEYS.bookings, seedBookings()); }
      if (!global.localStorage.getItem(KEYS.settings)) { write(KEYS.settings, seedSettings()); }
      if (!global.localStorage.getItem(KEYS.seq))      { write(KEYS.seq, 2043); }
      return this;
    },

    reset: function () {
      write(KEYS.courts, seedCourts());
      write(KEYS.bookings, seedBookings());
      write(KEYS.settings, seedSettings());
      write(KEYS.seq, 2043);
      return this;
    },

    getCourts:   function () { return read(KEYS.courts, []); },
    setCourts:   function (list) { write(KEYS.courts, list); },
    getCourt:    function (id) { return this.getCourts().filter(function (c) { return c.id === id; })[0] || null; },

    getBookings: function () { return read(KEYS.bookings, []); },
    setBookings: function (list) { write(KEYS.bookings, list); },

    getSettings: function () { return read(KEYS.settings, seedSettings()); },
    setSettings: function (s) { write(KEYS.settings, s); },

    // Next booking reference, e.g. BK-2044
    nextRef: function () {
      var n = read(KEYS.seq, 2043) + 1;
      write(KEYS.seq, n);
      return 'BK-' + n;
    },

    // Next court id, e.g. c6
    nextCourtId: function () {
      var ids = this.getCourts().map(function (c) { return parseInt(c.id.replace(/\D/g, ''), 10) || 0; });
      var max = ids.length ? Math.max.apply(null, ids) : 0;
      return 'c' + (max + 1);
    },

    addBooking: function (b) {
      var list = this.getBookings();
      list.unshift(b);
      this.setBookings(list);
      return b;
    },

    updateBooking: function (ref, patch) {
      var list = this.getBookings().map(function (b) {
        if (b.ref === ref) { for (var k in patch) { b[k] = patch[k]; } }
        return b;
      });
      this.setBookings(list);
    },

    addCourt: function (c) {
      var list = this.getCourts();
      list.push(c);
      this.setCourts(list);
      return c;
    },

    updateCourt: function (id, patch) {
      var list = this.getCourts().map(function (c) {
        if (c.id === id) { for (var k in patch) { c[k] = patch[k]; } }
        return c;
      });
      this.setCourts(list);
    },

    removeCourt: function (id) {
      this.setCourts(this.getCourts().filter(function (c) { return c.id !== id; }));
    },

    /* ---- derived helpers ---- */

    // Booking occupying a court+day+slot (confirmed/pending block the cell; cancelled frees it)
    bookingFor: function (courtId, day, slotId) {
      return this.getBookings().filter(function (b) {
        return b.courtId === courtId && b.day === day && b.slot === slotId && b.status !== 'cancelled';
      })[0] || null;
    },

    // Cell state for the timetable grid: 'maintenance' | 'booked' | 'available'
    cellState: function (court, day, slotId) {
      if (court.status === 'maintenance') { return 'maintenance'; }
      return this.bookingFor(court.id, day, slotId) ? 'booked' : 'available';
    }
  };

  /* ---------- expose ---------- */

  global.ArenaData = {
    SPORTS: SPORTS,
    SLOTS: SLOTS,
    PAY_METHODS: PAY_METHODS,
    Store: Store,
    // date utilities reused by both pages
    date: {
      toISO: toISO, today: today, dayOffset: dayOffset,
      fmtLong: fmtLong, DOW: DOW, MON: MON
    },
    // convenience: default price for a sport name
    priceForSport: function (name) {
      var s = SPORTS.filter(function (x) { return x.name === name; })[0];
      return s ? s.price : 40;
    }
  };

  // Seed immediately so every page load has data.
  Store.init();

})(window);
