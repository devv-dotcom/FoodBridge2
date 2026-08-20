# FoodBridge: Modules 6 and 7

## 1. Folder Structure

```
backend/
  controllers/volunteerController.js, pickupController.js
  database/volunteer_pickup.sql
  middleware/upload.js, validation.js
  models/Volunteer.js, VolunteerProfile.js, PickupRequest.js, DeliveryProof.js, PickupHistory.js
  routes/volunteerRoutes.js, pickupRoutes.js
```

## 2. SQL Tables

Run `database/volunteer_pickup.sql` after the existing core and donation/NGO schemas. It creates `volunteers`, `volunteer_profiles`, `pickup_requests`, `delivery_proofs`, and `pickup_history`, including foreign keys, unique keys, check constraints, and workflow indexes.

## 3. Models

Models use parameterized `mysql2` queries. `PickupRequest` provides the available/assigned queries and locks a pickup row during state-changing transactions. `DeliveryProof` ensures one current proof per pickup, while `PickupHistory` records completions.

## 4. Multer Upload Configuration

Images are stored under `uploads/volunteer-profile/` and `uploads/delivery-proof/`. Both accept PNG, JPG, JPEG, and WEBP and reject files larger than 5 MB. Send image uploads as `multipart/form-data` using the field name `image`.

## 5. Validation Middleware

Volunteer registration requires full name, valid email, phone, address, vehicle type, and an eight-character password. Profile, availability, password, and proof-note inputs are validated with `express-validator`; file MIME types are checked by Multer.

## 6. Volunteer Controller

`volunteerController` registers and signs in volunteers, returns/updates their profile, changes passwords, uploads a profile photo, changes availability, and returns active pickup assignments or completed history.

## 7. Pickup Controller

When an NGO accepts a donation, `AcceptedDonation.accept()` creates one pending pickup request. A volunteer must be online to accept it. State changes are transaction-safe: pending → volunteer assigned → pickup started → food collected → delivered → completed. Completion requires a delivery-proof record and increments completed deliveries.

## 8. Volunteer Routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/volunteer/register` | Register a volunteer |
| POST | `/api/volunteer/login` | Sign in |
| POST | `/api/volunteer/logout` | Client-side JWT logout acknowledgement |
| GET/PUT | `/api/volunteer/profile` | Read/update profile |
| POST | `/api/volunteer/profile/photo` | Upload profile image |
| PUT | `/api/volunteer/change-password` | Change password |
| PUT | `/api/volunteer/status` | Set online, offline, or busy |
| GET | `/api/volunteer/pickups` | Active assigned pickups |
| GET | `/api/volunteer/history` | Completed/cancelled pickups |

## 9. Pickup Routes

All pickup routes require a volunteer JWT.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/pickups` | Pending, unassigned pickup requests |
| GET | `/api/pickups/:id` | One available or owned pickup |
| POST | `/api/pickups/accept/:id` | Accept an available pickup |
| PUT | `/api/pickups/start/:id` | Mark pickup started |
| PUT | `/api/pickups/collect/:id` | Mark food collected |
| PUT | `/api/pickups/deliver/:id` | Mark food delivered |
| POST | `/api/pickups/proof/:id` | Upload delivery proof |
| PUT | `/api/pickups/complete/:id` | Complete delivery after proof upload |

## 10. API Examples

```http
POST /api/volunteer/register
Content-Type: application/json

{"fullName":"Asha Patel","email":"asha@example.com","phone":"9876543210","password":"SecurePass1","confirmPassword":"SecurePass1","address":"12 Lake Road","city":"Pune","state":"Maharashtra","pincode":"411001","vehicleType":"Scooter"}
```

```http
PUT /api/volunteer/status
Authorization: Bearer <token>
Content-Type: application/json

{"availability":"online"}
```

```http
POST /api/pickups/proof/42
Authorization: Bearer <token>
Content-Type: multipart/form-data

image=<delivery.jpg>&notes=Delivered safely to the NGO reception.
```

## 11. JSON Responses

```json
{"success":true,"message":"Pickup Accepted Successfully"}
```

```json
{"success":true,"message":"Delivery Completed Successfully"}
```

Validation failures return HTTP 422 with `success: false`, a message, and field-specific errors. Unauthorized and forbidden requests return 401 and 403 respectively.

## 12. Postman Testing

1. Run the existing schemas, then `volunteer_pickup.sql`, and start the API.
2. Register and log in as a volunteer; copy the returned JWT to an `Authorization: Bearer <token>` header.
3. Set availability to `online`.
4. Log in as an NGO and accept an available donation; this creates a pending pickup.
5. As the volunteer, call GET `/api/pickups`, accept the listed pickup, then call start, collect, deliver, proof, and complete in order.
6. Confirm the record appears in `/api/volunteer/history` and that completion fails with 422 if the proof step is skipped.

## 13. Folder Explanation

Routes map HTTP endpoints to controllers. Controllers coordinate authorization, validation results, transactions, and JSON responses. Models contain all SQL. Middleware centralizes JWT/role protection, input validation, and file handling. Database scripts define the persistent schema.

## 14. Best Practices

Keep `JWT_SECRET` and database credentials in `.env`; never commit them. Use HTTPS in production, a restrictive CORS origin, and object storage instead of local uploads when deploying multiple API instances. Back up the database, remove orphaned uploaded files when records are deleted, and add automated integration tests before production.
