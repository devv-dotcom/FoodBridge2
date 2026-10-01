# Food Rescue Modules 4 and 5 — Donations & NGOs

## Database

Run this after the authentication schema:

```bash
mysql -u root -p foodbridge < database/donation_ngo.sql
```

It creates `food_categories`, `donations`, `donation_images`, `ngos`, `ngo_profiles`, and `accepted_donations` with foreign keys, indexes, and status constraints.

## Donation API testing

Use a business JWT for write routes.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/donations` | List donations |
| GET | `/api/donations/:id` | Donation details and images |
| POST | `/api/donations` | Create donation (`multipart/form-data`) |
| PUT | `/api/donations/:id` | Update an available donation |
| DELETE | `/api/donations/:id` | Delete an available donation |
| GET | `/api/donations/search?q=meal` | Search food, category, city, business, status |
| GET | `/api/donations/filter?foodType=veg&status=available&today=true` | Filter donations |

For create/update, submit form-data fields: `foodName`, `categoryId`, `foodType`, `quantity`, `numberOfMeals`, `preparationTime`, `expiryTime`, `pickupDate`, `pickupTime`, `pickupAddress`, optional `latitude`, `longitude`, `description`, and up to five `images` files. Create requires at least one PNG/JPG/JPEG/WEBP image under 5MB.

## NGO API testing

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/ngo/register` | Register NGO account |
| POST | `/api/ngo/login` | NGO login |
| GET | `/api/ngo/profile` | Protected NGO profile |
| PUT | `/api/ngo/profile` | Update NGO profile |
| GET | `/api/ngo/donations` | Browse available donations |
| POST | `/api/ngo/accept/:id` | Accept one available donation |
| GET | `/api/ngo/history` | Accepted donation history |

Accepting a donation is transactional: only one active NGO can change an available donation to `accepted`.

## Scope and security

- No Volunteer, Pickup, or Admin behavior is included.
- Donation owners can only edit/delete their own `available` donations.
- Business and NGO routes require role-specific JWT middleware.
- Queries use placeholders; image uploads are type/size limited; IDs and fields are validated.
