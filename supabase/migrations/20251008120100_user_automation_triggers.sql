-- migration: 20251008120100_user_automation_triggers.sql
-- description: sets up database functions and triggers for user-related automations.
-- affected_tables: auth.users, public.profiles, public.categories, public.transactions
-- special_notes: this migration introduces business logic that runs automatically upon specific database events (new user registration, category deletion).

-- step 1: create function and trigger for new user setup
-- purpose: automates the creation of a user profile and a default set of categories when a new user signs up.

-- function: handle_new_user
-- description: inserts a new profile and default categories for the user specified in the new auth.users record.
create function public.handle_new_user()
returns trigger as $$
begin
  -- create a new profile for the user
  insert into public.profiles (id)
  values (new.id);

  -- insert default categories for the new user (Polish names)
  insert into public.categories (user_id, name, is_deletable)
  values
    (new.id, 'Jedzenie', true),
    (new.id, 'Rachunki', true),
    (new.id, 'Wynagrodzenie', true),
    (new.id, 'Rozrywka', true),
    (new.id, 'Inne', false); -- the 'Inne' category is not deletable

  return new;
end;
$$ language plpgsql security definer;
comment on function public.handle_new_user() is 'automatically creates a profile and default categories for a new user.';

-- trigger: on_auth_user_created
-- description: executes the handle_new_user function after a new user is created in auth.users.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- step 2: create function and trigger for safe category deletion
-- purpose: prevents data loss by re-assigning transactions to a default category before a category is deleted.

-- function: handle_category_delete
-- description: before deleting a category, this function finds the user's 'Inne' category and updates all transactions associated with the category being deleted to point to the 'Inne' category instead.
create function public.handle_category_delete()
returns trigger as $$
declare
  other_category_id uuid;
begin
  -- find the id of the non-deletable 'Inne' category for the current user
  select id into other_category_id
  from public.categories
  where user_id = old.user_id and is_deletable = false and name = 'Inne'
  limit 1;

  -- if the 'Inne' category is found, update the transactions
  if other_category_id is not null then
    update public.transactions
    set category_id = other_category_id
    where category_id = old.id;
  end if;

  return old;
end;
$$ language plpgsql security definer;
comment on function public.handle_category_delete() is 're-assigns transactions to the default ''Inne'' category before a category is deleted.';

-- trigger: before_category_delete
-- description: executes the handle_category_delete function before a category row is deleted.
create trigger before_category_delete
  before delete on public.categories
  for each row execute procedure public.handle_category_delete();
