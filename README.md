# Food Rescue

```
Food Rescue/
├── frontend/   # Static HTML, CSS, JavaScript, images, and browser assets
├── backend/    # Express API, MVC source, uploads, and module SQL scripts
└── database/   # Master database setup entry point
```

## Run locally

1. Run the master database script from the project root: `mysql -u root -p < database/foodbridge.sql`.
2. Configure `backend/.env`.
3. Start the API with `cd backend` then `pnpm start`.
4. Serve the `frontend/` directory through a static server. The browser client is configured for `http://localhost:5000` by default.

## Email sign-in codes

Donor, NGO, and administrator sign-ins require a one-time email code after the password is accepted. Codes expire after 10 minutes by default (`LOGIN_OTP_TTL_MS=600000`) and are single-use. Configure the `MAIL_*` settings from `.env.example` in `backend/.env` before running in production; production sign-in fails closed if the email cannot be delivered. Non-production environments return a generated `devOtp` to the local client for testing. Fixed OTP bypass codes are not supported.

<!-- Last pushed: 2026-08-20 12:15:15 -->
