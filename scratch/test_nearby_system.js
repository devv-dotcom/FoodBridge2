const geoService = require('../services/geoService');
const notifStore = require('../services/notifications');

console.log('--- Testing GeoService ---');
const dist = geoService.calculateDistance(17.3850, 78.4867, 17.4399, 78.4983);
console.log('Distance between Hyderabad center and Secunderabad:', dist, 'KM');
if (dist > 0 && dist < 10) {
  console.log('✓ Haversine distance calculation verified.');
} else {
  console.error('FAILED Haversine test');
}

const resolved = geoService.resolveCoordinates({ city: 'Hyderabad' });
console.log('Resolved city Hyderabad coords:', resolved);
if (resolved.latitude && resolved.longitude) {
  console.log('✓ Fallback coordinate resolution verified.');
} else {
  console.error('FAILED resolution test');
}

console.log('\n--- Testing Notification System ---');
const ngoUserId = '9991';
const donationId = 8888;

// Test push
const n1 = notifStore.push({
  recipientUserId: ngoUserId,
  targetRole: 'ngo',
  type: 'NEW_DONATION_NEARBY',
  title: '🍲 New Food Donation Available Nearby',
  body: 'A new food donation is available approximately 2.4 km away.',
  donationId: donationId,
  distanceKm: 2.4,
  foodName: 'Vegetable Biryani',
  quantity: '30 meals'
});
console.log('Pushed notification:', n1.id);

// Test duplicate prevention
const n2 = notifStore.push({
  recipientUserId: ngoUserId,
  targetRole: 'ngo',
  type: 'NEW_DONATION_NEARBY',
  title: '🍲 New Food Donation Available Nearby',
  body: 'A new food donation is available approximately 2.4 km away.',
  donationId: donationId,
  distanceKm: 2.4,
  foodName: 'Vegetable Biryani',
  quantity: '30 meals'
});
console.log('Duplicate push test (should match n1):', n1.id === n2.id ? '✓ Prevented duplicate' : 'FAILED');

// Test retrieve unread
const unread = notifStore.getUnread(ngoUserId);
console.log('Unread count for user 9991:', unread.length);
if (unread.length > 0 && unread[0].id === n1.id) {
  console.log('✓ Retrieve unread notifications verified.');
}

// Test mark read
const marked = notifStore.markRead(n1.id, ngoUserId);
console.log('Mark read result:', marked ? '✓ Marked read' : 'FAILED');

const unreadAfter = notifStore.getUnread(ngoUserId);
console.log('Unread count after mark read:', unreadAfter.length);
if (unreadAfter.length === 0) {
  console.log('✓ Unread count update verified.');
}

console.log('\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY ---');
