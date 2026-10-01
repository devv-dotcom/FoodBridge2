# Food Rescue Authentication Module

## 1. Folder structure

```
backend/
├── app.js
├── package.json
├── .env
├── config/database.js
├── controllers/authController.js
├── database/schema.sql
├── middleware/auth.js
├── middleware/validation.js
├── models/User.js
├── routes/authRoutes.js
└── utils/mail.js
```

## 2. Install and run

```bash
cd backend
npm install
mysql -u root -p < database/schema.sql
npm run dev
```

Copy the sample values in `.env` to your real MySQL and SMTP credentials before starting. Generate a long random `JWT_SECRET`; do not commit a real `.env` file to source control.

## 3. Database

Run `database/schema.sql`. It creates the `foodbridge` database and the `users` table. The extra `otp_expires_at` column makes password-reset OTPs expire after ten minutes.

## 4. Postman API testing

Base URL: `http://localhost:5000`

### Register — `POST /api/auth/register`

```json
{
  "fullName": "Asha Sharma",
  "email": "asha@example.com",
  "mobile": "+919876543210",
  "password": "SafePass123!",
  "confirmPassword": "SafePass123!",
  "role": "restaurant",
  "businessName": "Asha Kitchen",
  "address": "12 Green Street",
  "city": "Hyderabad",
  "state": "Telangana",
  "pincode": "500001"
}
```

### Login — `POST /api/auth/login`

```json
{ "email": "asha@example.com", "password": "SafePass123!" }
```

Copy `token` from the response into an `Authorization: Bearer <token>` header for the protected endpoints below.

### Profile — `GET /api/auth/profile`

### Logout — `POST /api/auth/logout`

### Forgot password — `POST /api/auth/forgot-password`

```json
{ "email": "asha@example.com" }
```

### Verify OTP — `POST /api/auth/verify-otp`

```json
{ "email": "asha@example.com", "otp": "123456" }
```

Copy `resetToken` from the response.

### Reset password — `POST /api/auth/reset-password`

```json
{
  "resetToken": "PASTE_RESET_TOKEN",
  "newPassword": "NewSafePass123!",
  "confirmPassword": "NewSafePass123!"
}
```

## 5. Best practices included

- Parameterized MySQL queries prevent SQL injection.
- Passwords and OTPs are hashed; plaintext OTPs are never stored.
- Access tokens and reset tokens have independent, short/long expiry policies.
- Validation is centralized and all API responses use JSON.
- Helmet, CORS, body-size limits, and environment-based credentials are enabled.
- Authentication and role-authorization middleware are reusable by future modules.
