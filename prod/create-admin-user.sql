-- SQL Script to Create Admin User
-- Run this against your PostgreSQL database to create an initial admin user

-- NOTE: Replace the password hash with an actual bcrypt hash
-- Generate bcrypt hash with: bcrypt.hash('your-password-here', 10)

-- For testing purposes only, this creates an admin user with email: admin@example.com
-- Make sure to change this to a real email and secure password in production!

INSERT INTO "User" (
  id,
  name,
  email,
  "emailVerified",
  "passwordHash",
  role,
  "subscriptionTier",
  "subscriptionStatus",
  status,
  "onboardingCompleted",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'Admin User',
  'admin@example.com', -- CHANGE THIS IN PRODUCTION
  true,
  '$2b$10$YOUR_BCRYPT_HASH_HERE', -- CHANGE THIS - see note below
  'admin', -- or 'super_admin' for full access
  'pro',
  'active',
  'active',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- To generate a proper bcrypt hash:
-- 1. Use Node.js:
--    const bcrypt = require('bcrypt');
--    const hash = bcrypt.hashSync('YourSecurePassword123!', 10);
--    console.log(hash);
--
-- 2. Or use an online bcrypt generator (be cautious with production passwords)
--
-- 3. Or run this from your Node.js project:
--    node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('YourPassword', 10));"

-- Example query to verify admin user was created:
-- SELECT id, name, email, role, "subscriptionTier", status FROM "User" WHERE role IN ('admin', 'super_admin');

-- Example query to update existing user to admin:
-- UPDATE "User" SET role = 'admin' WHERE email = 'your-email@example.com';

-- Grant super_admin role to existing admin:
-- UPDATE "User" SET role = 'super_admin' WHERE email = 'admin@example.com';
