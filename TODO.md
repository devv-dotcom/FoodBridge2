# Error Fix TODO

## Errors Identified
1. `frontend/index.html` — Invalid CSS in `.nav-right-group` (`display: flex !items: center`)
2. `frontend/dashboard.html` — Null reference to non-existent `#welcome-title` element
3. Backend missing NGO status update endpoint (`PUT /api/ngo/status/:id`) used by dashboard

## Steps
- [x] 1. Create TODO.md
- [x] 2. Fix `frontend/index.html` CSS `.nav-right-group`
- [x] 3. Fix `frontend/dashboard.html` `#welcome-title` null reference
- [x] 4. Add `updateDonationStatus` handler to `backend/controllers/ngoController.js`
- [x] 5. Add `PUT /api/ngo/status/:id` route to `backend/routes/ngoRoutes.js`
- [x] 6. Verify backend starts without errors
