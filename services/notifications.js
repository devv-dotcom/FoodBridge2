/**
 * FoodBridge Notification Store
 * --------------------------------------------------
 * Lightweight in-memory + file-persisted notification
 * system. No extra npm packages required.
 *
 * Notification shape:
 * {
 *   id        : string  (uuid-like)
 *   type      : 'NEW_DONATION' | 'CLAIM' | 'DELIVERY' | 'ALERT'
 *   title     : string
 *   body      : string
 *   donationId: number | null
 *   donorName : string
 *   foodName  : string
 *   quantity  : string
 *   city      : string
 *   createdAt : ISO string
 *   readBy    : string[]   (array of user IDs who read it)
 * }
 */

const fs   = require('fs');
const path = require('path');

const STORE_FILE = path.join(__dirname, '..', 'data', 'notifications.json');

// ── Ensure data directory exists ──────────────────────────────────────────────
function ensureDir() {
  const dir = path.dirname(STORE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── Read all notifications from disk ─────────────────────────────────────────
function readAll() {
  ensureDir();
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  } catch {
    return [];
  }
}

// ── Write all notifications to disk ──────────────────────────────────────────
function writeAll(notifications) {
  ensureDir();
  // Keep only the most recent 200 to avoid unbounded growth
  const trimmed = notifications.slice(-200);
  fs.writeFileSync(STORE_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
}

// ── Simple ID generator ───────────────────────────────────────────────────────
function uid() {
  return `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Push a new notification ───────────────────────────────────────────────────
function push(data) {
  const notifications = readAll();
  const entry = {
    id:         uid(),
    type:       data.type       || 'NEW_DONATION',
    title:      data.title      || '🍱 New Food Available',
    body:       data.body       || '',
    donationId: data.donationId || null,
    donorName:  data.donorName  || 'A Donor',
    foodName:   data.foodName   || 'Food',
    quantity:   data.quantity   || '',
    city:       data.city       || '',
    createdAt:  new Date().toISOString(),
    readBy:     [],
  };
  notifications.push(entry);
  writeAll(notifications);
  return entry;
}

// ── Get unread notifications for a user (NGO/Volunteer) ──────────────────────
function getUnread(userId, limit = 30) {
  const all = readAll();
  return all
    .filter(n => !n.readBy.includes(String(userId)))
    .slice(-limit)
    .reverse();
}

// ── Get all recent notifications (for admin / full view) ─────────────────────
function getRecent(limit = 50) {
  return readAll().slice(-limit).reverse();
}

// ── Mark one notification as read for a user ─────────────────────────────────
function markRead(notifId, userId) {
  const all = readAll();
  const notif = all.find(n => n.id === notifId);
  if (!notif) return false;
  if (!notif.readBy.includes(String(userId))) {
    notif.readBy.push(String(userId));
  }
  writeAll(all);
  return true;
}

// ── Mark ALL as read for a user ───────────────────────────────────────────────
function markAllRead(userId) {
  const all = readAll();
  all.forEach(n => {
    if (!n.readBy.includes(String(userId))) n.readBy.push(String(userId));
  });
  writeAll(all);
}

module.exports = { push, getUnread, getRecent, markRead, markAllRead };
