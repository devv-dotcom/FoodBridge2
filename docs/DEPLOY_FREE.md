# Free hobby deployment

This repository can run as one Render Node web service with a TiDB Cloud Starter database. Render's free service sleeps after inactivity, so the first page load after a quiet period can take about a minute. TiDB Cloud Starter has a free monthly quota; keep usage within its quota to avoid usage charges.

## 1. Create the database

Create a free TiDB Cloud Starter cluster and database named `foodbridge`. Save its host, username, and password. Use the cluster's TLS connection settings; the app uses port `4000` and TLS when `DB_SSL=true`.

Initialize the database, in order, using a MySQL client connected to TiDB:

1. `database/foodbridge.sql`
2. `database/login_otp.sql`
3. `database/patch_v2.sql`
4. `database/patch_v3.sql`
5. `database/patch_v4.sql`
6. `database/patch_v5.sql`

The master SQL file uses MySQL-client `SOURCE` commands for the core modules, so run it from the repository root with a MySQL client rather than pasting it into a web SQL editor.

## 2. Configure free email delivery

Create a free Brevo account, verify a sender address, and create an API key. Render's free web services block outbound SMTP ports used by the existing SMTP configuration; this app uses Brevo's HTTPS email API when `BREVO_API_KEY` is set.

## 3. Deploy the web service

In Render, choose **New → Blueprint**, connect this GitHub repository, and select the `render.yaml` Blueprint. Enter the TiDB host, username, password, and database name, plus the Brevo API key and verified sender in the prompted environment variables. The Blueprint generates a JWT secret and deploys the app with `npm ci` / `npm start`.

After deployment, open the service URL and confirm `/health` returns a healthy response. The health check includes a database query, so it will not pass until the TiDB schema and connection variables are ready.

## Free-tier limits

- Render's free web service sleeps after 15 minutes without traffic and has an ephemeral filesystem. Uploaded images do not persist across restarts or deploys.
- Render free services can be restarted and have monthly usage limits.
- TiDB Cloud Starter is free only within its published quota. Monitor usage in TiDB Cloud.
- Brevo requires a verified sender. Email delivery is limited by the account's free-plan limits.
