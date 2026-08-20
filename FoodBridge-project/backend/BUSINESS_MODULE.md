# FoodBridge Modules 2 and 3 — Business Role Management & Dashboard

## Folder additions

```
backend/
├── controllers/businessController.js
├── database/business.sql
├── middleware/upload.js
├── models/Business.js
├── models/BusinessProfile.js
├── models/BusinessImage.js
└── routes/businessRoutes.js
```

## Database setup

Run this after `database/schema.sql`:

```bash
mysql -u root -p foodbridge < database/business.sql
```

`business_profiles.business_type` is strictly limited to: `restaurant`, `hotel`, `bakery`, `supermarket`, `catering`, and `marriage_hall`. The authenticated account role must match the profile business type.

## Postman testing

Use an access token from `POST /api/auth/login` in every request below:

```
Authorization: Bearer <JWT_TOKEN>
```

### Dashboard — `GET /api/business/dashboard`

Returns the authenticated business identity, contact details, images, account state, and zeroed donation metrics. Donation metrics remain zero because the Donation module is deliberately out of scope.

### Profile — `GET /api/business/profile`

### Update profile — `PUT /api/business/profile`

```json
{
  "fullName": "Asha Sharma",
  "email": "asha@example.com",
  "mobile": "+919876543210",
  "businessName": "Asha Kitchen",
  "businessType": "restaurant",
  "address": "12 Green Street",
  "city": "Hyderabad",
  "state": "Telangana",
  "pincode": "500001"
}
```

### Upload logo — `POST /api/business/logo`

Use `multipart/form-data` and add an `image` field containing a PNG, JPG, or JPEG under 2MB.

### Upload cover — `POST /api/business/cover`

Use the same multipart field (`image`).

### Change password — `PUT /api/business/change-password`

```json
{
  "currentPassword": "SafePass123!",
  "newPassword": "NewSafePass123!",
  "confirmPassword": "NewSafePass123!"
}
```

## Security and implementation notes

- Every business route requires a valid JWT and a business-only role.
- Multer only accepts PNG/JPG/JPEG files, limits uploads to 2MB, and uses generated filenames.
- MySQL operations use parameterized queries and profile updates use a transaction.
- Account roles are not editable through the profile API, preventing an account from changing its authorization level.
