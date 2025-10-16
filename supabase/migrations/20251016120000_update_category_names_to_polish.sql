-- migration: 20251016120000_update_category_names_to_polish.sql
-- description: updates existing category names to Polish equivalents for all existing users.
-- affected_tables: public.categories
-- special_notes: this migration updates only the default categories created during user registration. user-created custom categories are not affected.

-- step 1: update category names to polish equivalents
-- purpose: standardize category names to polish language for existing users.

-- update "Opłaty" to "Rachunki" (Bills)
update public.categories
set name = 'Rachunki'
where name = 'Opłaty';

-- update "Przyjemności" to "Rozrywka" (Entertainment)
update public.categories
set name = 'Rozrywka'
where name = 'Przyjemności';

-- note: the following categories already have correct polish names:
-- - "Jedzenie" (Food)
-- - "Wynagrodzenie" (Salary)
-- - "Inne" (Other)

-- step 2: verify the migration with comments
comment on table public.categories is 'stores user-defined and default transaction categories. default categories updated to polish names on 2025-10-16.';

