# FoodBridge Frontend Integration

## 1. Project Structure

The new browser modules live in `js/`: `api.js`, `auth.js`, `dashboard.js`, `donation.js`, `ngo.js`, `volunteer.js`, `admin.js`, `contact.js`, `profile.js`, `utils.js`, and `app.js`.

## 2. API Helper

`api.js` is the single Fetch client. It parses JSON, attaches bearer tokens, normalizes errors, and safely manages session storage. Configure a different server with `<html data-api-base="http://localhost:5000">`.

## 3. Authentication Integration

Add `data-api-form="login"` or `data-api-form="register"` to a form. The form field names must match the backend request fields. Sign-in stores the token and redirects by role.

## 4. Dashboard Integration

Set `data-dashboard="business|ngo|volunteer|admin"` on a dashboard body. Use `data-api-value="field"` for API values and the documented list container IDs for histories.

## 5. Donation Integration

Use `data-api-form="donation"`, `data-donation-image`, and `data-donation-preview`. Valid images are sent as multipart `images` files.

## 6. NGO Integration

`data-action="load-available-donations"` loads donations and renders accept buttons that call `/api/ngo/accept/:id`.

## 7. Volunteer Integration

`data-action="load-pickups"` loads pickup requests. The action names `accept-pickup`, `start-pickup`, `collect-pickup`, `deliver-pickup`, and `complete-pickup` map to the matching pickup APIs.

## 8. Admin Integration

Use `data-admin-list="/api/admin/businesses" data-target="#results"` to load an admin list, or `data-admin-endpoint="/api/admin/business/approve/42"` for a moderation button.

## 9. Contact Form Integration

Use `data-api-form="contact"` with `name`, `email`, `subject`, and `message` fields. It calls `POST /api/contact`.

## 10. Profile Integration

Use `data-api-form="profile"`; fields use role profile API names. Add `data-profile-image`, `data-profile-preview`, and `data-action="upload-profile-image"` to support the available profile uploads.

## 11. JWT Handling

The JWT and public user payload are stored in local storage. Every authenticated API call adds `Authorization: Bearer <token>` and a 401 clears the session.

## 12. Route Protection

Add `data-required-role="admin|ngo|volunteer|business"` to protected page bodies. Add `data-guest-only="true"` on login/register pages for automatic dashboard redirection.

## 13. Loading Spinner

Requests disable their trigger, set `aria-busy`, and show a short loading label until the server responds.

## 14. Toast Notification

Accessible success, warning, and error toasts are created at runtime; no additional markup is needed.

## 15. Error Handling

The client converts API failures into a common error type and shows useful feedback for 400, 401, 403, 404, and server errors.

## 16. Best Practices

Use HTTPS in production, set an explicit API base URL, keep CORS restrictive, and escape any API-derived value before rendering HTML. Fetch does not expose reliable browser upload-progress events, so this Fetch-only integration uses button loading state instead.

## Existing Frontend Note

The current repository has one landing page and only a newsletter form. It now loads `js/app.js`, but it contains none of the data attributes or account/dashboard forms described above, so the role workflows will activate once those existing HTML pages are added or annotated. Also, the backend currently has no `POST /api/contact` route; the contact module is ready for that contract but will receive 404 until that endpoint exists.
