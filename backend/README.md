## How to Reset and Seed the Database

To start with a fresh database:

1. **Remove old migration files and the database file:**

   - Delete the `migrate` folder inside `prisma/`
   - Delete the `dev.db` file inside `prisma/`

2. **Recreate the database and apply migrations:**

   ```bash
   npx prisma migrate dev --name init
   ```

3. **Seed the database with initial data:**
   ```bash
   npx prisma db seed
   ```

Your database is now reset and seeded!
