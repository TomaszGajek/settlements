-- seed.sql
-- Purpose: Seeds the database with test data for E2E testing
-- This file is automatically run when you execute `supabase db reset`

-- Create test user for E2E tests
-- Email: test@example.com
-- Password: TestPassword123!
-- Note: The password is hashed using crypt with the bcrypt algorithm

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test@example.com',
  -- Password hash for 'TestPassword123!' using bcrypt
  crypt('TestPassword123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  FALSE,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- The profile and default categories will be automatically created by the trigger
-- handle_new_user() from migration 20251008120100_user_automation_triggers.sql

-- Optionally, add some sample transactions for the test user
-- Wait a moment for the trigger to complete by inserting after a delay in a function
DO $$
DECLARE
  test_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  category_jedzenie_id uuid;
  category_rachunki_id uuid;
  category_wynagrodzenie_id uuid;
BEGIN
  -- Get category IDs for the test user
  SELECT id INTO category_jedzenie_id FROM public.categories WHERE user_id = test_user_id AND name = 'Jedzenie';
  SELECT id INTO category_rachunki_id FROM public.categories WHERE user_id = test_user_id AND name = 'Rachunki';
  SELECT id INTO category_wynagrodzenie_id FROM public.categories WHERE user_id = test_user_id AND name = 'Wynagrodzenie';

  -- Insert sample transactions if categories exist
  IF category_jedzenie_id IS NOT NULL THEN
    INSERT INTO public.transactions (user_id, category_id, amount, type, date, note)
    VALUES
      (test_user_id, category_jedzenie_id, 50.00, 'expense', CURRENT_DATE - INTERVAL '5 days', 'Zakupy spożywcze'),
      (test_user_id, category_jedzenie_id, 25.50, 'expense', CURRENT_DATE - INTERVAL '3 days', 'Obiad w restauracji');
  END IF;

  IF category_rachunki_id IS NOT NULL THEN
    INSERT INTO public.transactions (user_id, category_id, amount, type, date, note)
    VALUES
      (test_user_id, category_rachunki_id, 120.00, 'expense', CURRENT_DATE - INTERVAL '10 days', 'Rachunek za prąd');
  END IF;

  IF category_wynagrodzenie_id IS NOT NULL THEN
    INSERT INTO public.transactions (user_id, category_id, amount, type, date, note)
    VALUES
      (test_user_id, category_wynagrodzenie_id, 5000.00, 'income', CURRENT_DATE - INTERVAL '15 days', 'Wynagrodzenie miesięczne');
  END IF;
END $$;

-- Create identity record for the test user
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  jsonb_build_object(
    'sub', '00000000-0000-0000-0000-000000000001'::text,
    'email', 'test@example.com'
  ),
  'email',
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (provider, provider_id) DO NOTHING;

-- Log that seeding is complete
DO $$
BEGIN
  RAISE NOTICE 'Database seeded successfully with test user: test@example.com';
END $$;

