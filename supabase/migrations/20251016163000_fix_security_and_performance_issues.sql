-- migration: fix_security_and_performance_issues
-- description: Fixes security warnings (function search_path) and performance issues (RLS policies optimization)

-- Step 1: Fix function search_path security issues
-- Drop and recreate handle_new_user with fixed search_path
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- create a new profile for the user
  INSERT INTO public.profiles (id)
  VALUES (new.id);

  -- insert default categories for the new user (Polish names)
  INSERT INTO public.categories (user_id, name, is_deletable)
  VALUES
    (new.id, 'Jedzenie', true),
    (new.id, 'Rachunki', true),
    (new.id, 'Wynagrodzenie', true),
    (new.id, 'Rozrywka', true),
    (new.id, 'Inne', false); -- the 'Inne' category is not deletable

  RETURN new;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth;

COMMENT ON FUNCTION public.handle_new_user() IS 'automatically creates a profile and default categories for a new user.';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Drop and recreate handle_category_delete with fixed search_path
DROP TRIGGER IF EXISTS before_category_delete ON public.categories;
DROP FUNCTION IF EXISTS public.handle_category_delete();

CREATE FUNCTION public.handle_category_delete()
RETURNS TRIGGER AS $$
DECLARE
  other_category_id uuid;
BEGIN
  -- find the id of the non-deletable 'Inne' category for the current user
  SELECT id INTO other_category_id
  FROM public.categories
  WHERE user_id = old.user_id AND is_deletable = false AND name = 'Inne'
  LIMIT 1;

  -- if the 'Inne' category is found, update the transactions
  IF other_category_id IS NOT NULL THEN
    UPDATE public.transactions
    SET category_id = other_category_id
    WHERE category_id = old.id;
  END IF;

  RETURN old;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION public.handle_category_delete() IS 're-assigns transactions to the default ''Inne'' category before a category is deleted.';

CREATE TRIGGER before_category_delete
  BEFORE DELETE ON public.categories
  FOR EACH ROW EXECUTE PROCEDURE public.handle_category_delete();

-- Step 2: Optimize RLS policies for better performance
-- Profiles table policies
DROP POLICY IF EXISTS "allow_authenticated_read_own_data_on_profiles" ON public.profiles;
DROP POLICY IF EXISTS "allow_authenticated_insert_own_data_on_profiles" ON public.profiles;
DROP POLICY IF EXISTS "allow_authenticated_update_own_data_on_profiles" ON public.profiles;

CREATE POLICY "allow_authenticated_read_own_data_on_profiles" 
  ON public.profiles FOR SELECT 
  TO authenticated 
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "allow_authenticated_insert_own_data_on_profiles" 
  ON public.profiles FOR INSERT 
  TO authenticated 
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "allow_authenticated_update_own_data_on_profiles" 
  ON public.profiles FOR UPDATE 
  TO authenticated 
  USING ((SELECT auth.uid()) = id) 
  WITH CHECK ((SELECT auth.uid()) = id);

-- Categories table policies
DROP POLICY IF EXISTS "allow_authenticated_read_own_data_on_categories" ON public.categories;
DROP POLICY IF EXISTS "allow_authenticated_insert_own_data_on_categories" ON public.categories;
DROP POLICY IF EXISTS "allow_authenticated_update_own_data_on_categories" ON public.categories;
DROP POLICY IF EXISTS "allow_authenticated_delete_own_data_on_categories" ON public.categories;

CREATE POLICY "allow_authenticated_read_own_data_on_categories" 
  ON public.categories FOR SELECT 
  TO authenticated 
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "allow_authenticated_insert_own_data_on_categories" 
  ON public.categories FOR INSERT 
  TO authenticated 
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "allow_authenticated_update_own_data_on_categories" 
  ON public.categories FOR UPDATE 
  TO authenticated 
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "allow_authenticated_delete_own_data_on_categories" 
  ON public.categories FOR DELETE 
  TO authenticated 
  USING ((SELECT auth.uid()) = user_id AND is_deletable = true);

-- Transactions table policies
DROP POLICY IF EXISTS "allow_authenticated_read_own_data_on_transactions" ON public.transactions;
DROP POLICY IF EXISTS "allow_authenticated_insert_own_data_on_transactions" ON public.transactions;
DROP POLICY IF EXISTS "allow_authenticated_update_own_data_on_transactions" ON public.transactions;
DROP POLICY IF EXISTS "allow_authenticated_delete_own_data_on_transactions" ON public.transactions;

CREATE POLICY "allow_authenticated_read_own_data_on_transactions" 
  ON public.transactions FOR SELECT 
  TO authenticated 
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "allow_authenticated_insert_own_data_on_transactions" 
  ON public.transactions FOR INSERT 
  TO authenticated 
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "allow_authenticated_update_own_data_on_transactions" 
  ON public.transactions FOR UPDATE 
  TO authenticated 
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "allow_authenticated_delete_own_data_on_transactions" 
  ON public.transactions FOR DELETE 
  TO authenticated 
  USING ((SELECT auth.uid()) = user_id);

