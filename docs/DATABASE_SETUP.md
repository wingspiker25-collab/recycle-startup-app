# Database Setup

This project uses **PostgreSQL**. Follow these steps to create and initialize the database.

## Prerequisites

- PostgreSQL installed and running on your machine
- Node.js and npm

## 1. Create `.env` in the backend folder

Copy the example file and edit:

```bash
cd backend
copy .env.example .env
```

Edit `.env` and set your PostgreSQL credentials:
- `DATABASE_BASE_URL` – connection to the default `postgres` database (used to create our app database)
- `DATABASE_URL` – connection to the `recycle_app` database

Example:
```
DATABASE_BASE_URL=postgresql://your_user:your_password@your_host:5432/your_db
DATABASE_URL=postgresql://your_user:your_password@your_host:5432/your_db
```

## 2. Create the database

From the `backend` folder:

```bash
npm install
npm run db:create
```

This creates a new database named `recycle_app`.

## 3. Create tables (schema)

```bash
npm run db:setup
```

This runs `schema.sql` and creates all required tables: `users`, `invites`, `pickups`, `scrap_items`, `payments`, `pickup_images`, `messages`, `scrap_rates`.

## Alternative: Manual setup

If you prefer to create the database manually:

1. Open `psql` or pgAdmin.
2. Create the database:
   ```sql
   CREATE DATABASE recycle_app;
   ```
3. Set `DATABASE_URL` in `.env` to point to `recycle_app`.
4. Run `npm run db:setup` to create the tables.
