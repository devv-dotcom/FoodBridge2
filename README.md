# FoodBridge

```
FoodBridge/
├── frontend/   # Static HTML, CSS, JavaScript, images, and browser assets
├── backend/    # Express API, MVC source, uploads, and module SQL scripts
└── database/   # Master database setup entry point
```

## Run locally

1. Run the master database script from the project root: `mysql -u root -p < database/foodbridge.sql`.
2. Configure `backend/.env`.
3. Start the API with `cd backend` then `pnpm start`.
4. Serve the `frontend/` directory through a static server. The browser client is configured for `http://localhost:5000` by default.

<!-- Last pushed: 2026-08-20 12:15:15 -->
