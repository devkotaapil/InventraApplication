# Inventra Application

Inventra is a MERN inventory management system for small retail stores. Shop users can manage products, inventory, sales, analytics, stock recommendations, and movement history. Admin users can manage and review the platform from the admin dashboard.

The app also includes a simple freemium billing flow. Users start at the `free` level, can upgrade to `basic`, and can later upgrade to `pro` through Khalti sandbox checkout.

## URLs

Frontend: `http://127.0.0.1:5173`

Backend: `http://localhost:5000`

## Server Setup

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env`, then add your local database/JWT values and Khalti sandbox credentials:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=change_this_inventra_secret
CLIENT_ORIGIN=http://127.0.0.1:5173

KHALTI_BASE_URL=https://dev.khalti.com/api/v2
KHALTI_SECRET_KEY=your_khalti_sandbox_secret_key
```

Keep the Khalti secret key in `server/.env` only:

```env
KHALTI_SECRET_KEY=your_actual_sandbox_secret_key
```

The public key is not required for Inventra's current redirect checkout flow, so do not put it in the React app. `KHALTI_API_URL` is also accepted as an alias for `KHALTI_BASE_URL`.

Start the server:

```bash
npm run dev
```

## Client Setup

```bash
cd client
npm install
npm run dev
```

## Khalti Sandbox Flow

1. Create or log in to a Khalti sandbox merchant account.
2. Add the sandbox secret key to `server/.env` as `KHALTI_SECRET_KEY`.
3. Keep the public key saved in your Khalti dashboard; Inventra does not need it for redirect checkout.
4. Keep `KHALTI_BASE_URL=https://dev.khalti.com/api/v2` for sandbox, or set `KHALTI_API_URL` to the same value.
5. Start both server and client.
6. Open `/pricing` to view the free tier and paid plans.
7. Register or log in as a normal shop user.
8. Use the free features: dashboard summary, products, inventory, and sales.
9. Choose Basic or Pro on `/billing` and pay with Khalti to unlock premium pages.
10. After Khalti redirects back to `/billing/return`, Inventra verifies the payment by `pidx`.
11. If Khalti lookup returns `Completed`, the user's billing level is updated.

Billing levels:

- `free`: dashboard summary, products, inventory, and sales.
- `basic`: everything in free, plus analytics.
- `pro`: everything in basic, plus recommendations and movement history.

Admin users do not need payment and can continue using `/admin`.

## Seed Demo Data

Seed is for demo data only. It clears existing users, products, inventory, sales, payments, subscriptions, and audit logs.

```bash
cd server
npm run seed
```

Demo admin:

```text
admin@inventra.com / admin123
```
