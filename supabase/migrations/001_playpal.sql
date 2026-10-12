-- PlayPal starter schema. Apply in a dedicated Supabase project after reviewing policies.
create extension if not exists pgcrypto;
create type public.account_role as enum ('parent','child','trusted_adult');
create type public.session_state as enum ('draft','pending_parent_approval','approved','active','completed','rejected','cancelled');
create type public.approval_state as enum ('pending','approved','rejected','revoked');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.account_role not null,
  display_name text not null check (length(display_name) between 1 and 50),
  created_at timestamptz not null default now()
);
create or replace function public.prevent_profile_role_change() returns trigger language plpgsql set search_path=public as $$
begin
  if new.role <> old.role then raise exception 'Profile roles cannot be changed'; end if;
  return new;
end $$;
create trigger profiles_role_immutable before update on public.profiles
for each row execute function public.prevent_profile_role_change();
create table public.parent_child_relationships (
  parent_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  state public.approval_state not null default 'pending',
  created_at timestamptz not null default now(),
  primary key(parent_id,child_id), check(parent_id <> child_id)
);
create table public.trusted_adults (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  verification_status text not null default 'unverified' check(verification_status in ('unverified','in_review','verified','rejected')),
  reviewed_at timestamptz,
  reviewer_id uuid references public.profiles(id)
);
create table public.trusted_adult_authorizations (
  parent_id uuid not null references public.profiles(id) on delete cascade,
  adult_id uuid not null references public.profiles(id) on delete cascade,
  state public.approval_state not null default 'pending',
  created_at timestamptz not null default now(), primary key(parent_id,adult_id), check(parent_id <> adult_id)
);
create table public.play_spaces (
  id uuid primary key default gen_random_uuid(), name text not null, general_area text not null,
  activities text[] not null default '{}', status text not null default 'demo' check(status in ('demo','verified','unverified')),
  notes text not null default '', created_at timestamptz not null default now()
);
create table public.approved_play_zones (
  parent_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  space_id uuid not null references public.play_spaces(id) on delete cascade,
  active boolean not null default true, created_at timestamptz not null default now(), primary key(parent_id,child_id,space_id)
);
create table public.play_groups (
  id uuid primary key default gen_random_uuid(), name text not null, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.group_memberships (
  group_id uuid not null references public.play_groups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  state public.approval_state not null default 'pending', created_at timestamptz not null default now(), primary key(group_id,profile_id)
);
create table public.friendships (
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  state public.approval_state not null default 'pending', created_at timestamptz not null default now(),
  primary key(requester_id,recipient_id), check(requester_id <> recipient_id)
);
create table public.play_sessions (
  id uuid primary key default gen_random_uuid(), title text not null, description text not null default '',
  starts_at timestamptz not null, ends_at timestamptz not null, space_id uuid not null references public.play_spaces(id),
  supervisor_id uuid not null references public.profiles(id), created_by uuid not null references public.profiles(id),
  state public.session_state not null default 'draft', safety_notes text not null default '', created_at timestamptz not null default now(),
  check(ends_at > starts_at)
);
create index play_sessions_start_idx on public.play_sessions(starts_at) where state in ('approved','active');
create table public.session_participants (
  session_id uuid not null references public.play_sessions(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  state public.approval_state not null default 'pending', requested_at timestamptz not null default now(), primary key(session_id,child_id)
);
create table public.session_approvals (
  session_id uuid not null references public.play_sessions(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid not null references public.profiles(id) on delete cascade,
  state public.approval_state not null default 'pending', decided_at timestamptz,
  primary key(session_id,child_id,parent_id)
);
create table public.missions (
  id uuid primary key default gen_random_uuid(), name text not null unique, description text not null,
  points integer not null check(points between 0 and 100), adult_confirmation boolean not null default true, active boolean not null default true
);
create table public.mission_completions (
  id uuid primary key default gen_random_uuid(), mission_id uuid not null references public.missions(id),
  child_id uuid not null references public.profiles(id), confirmed_by uuid references public.profiles(id),
  completed_at timestamptz not null default now(), unique(mission_id,child_id)
);
create table public.challenges (id uuid primary key default gen_random_uuid(), name text not null, description text not null, active boolean not null default true);
create table public.challenge_participants (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  state public.approval_state not null default 'pending', primary key(challenge_id,child_id)
);
create table public.badges (id uuid primary key default gen_random_uuid(), name text not null unique, description text not null);
create table public.user_badges (profile_id uuid not null references public.profiles(id) on delete cascade, badge_id uuid not null references public.badges(id), earned_at timestamptz not null default now(), primary key(profile_id,badge_id));
create table public.reward_transactions (
  id uuid primary key default gen_random_uuid(), child_id uuid not null references public.profiles(id),
  mission_completion_id uuid unique references public.mission_completions(id), points integer not null check(points > 0), created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.play_sessions(id) on delete cascade, title text not null, body text not null,
  read_at timestamptz, created_at timestamptz not null default now()
);
create table public.session_event_logs (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.play_sessions(id) on delete cascade,
  actor_id uuid not null references public.profiles(id), event_type text not null, created_at timestamptz not null default now()
);

-- Helper functions are SECURITY DEFINER with a fixed search_path to avoid RLS recursion.
create or replace function public.is_parent_of(target_child uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from parent_child_relationships r where r.parent_id=auth.uid() and r.child_id=target_child and r.state='approved') $$;
create or replace function public.is_session_supervisor(target_session uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from play_sessions s join trusted_adults t on t.profile_id=s.supervisor_id where s.id=target_session and s.supervisor_id=auth.uid() and t.verification_status='verified' and exists(select 1 from trusted_adult_authorizations a where a.adult_id=auth.uid() and a.state='approved')) $$;

alter table public.profiles enable row level security;
alter table public.parent_child_relationships enable row level security;
alter table public.trusted_adults enable row level security;
alter table public.trusted_adult_authorizations enable row level security;
alter table public.play_spaces enable row level security;
alter table public.approved_play_zones enable row level security;
alter table public.play_groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.friendships enable row level security;
alter table public.play_sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.session_approvals enable row level security;
alter table public.missions enable row level security;
alter table public.mission_completions enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.reward_transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.session_event_logs enable row level security;

create policy "profile self or linked guardian read" on public.profiles for select using(id=auth.uid() or public.is_parent_of(id));
create policy "profile self update" on public.profiles for update using(id=auth.uid()) with check(id=auth.uid());
create policy "guardian reads child links" on public.parent_child_relationships for select using(parent_id=auth.uid() or child_id=auth.uid());
create policy "parent manages child links" on public.parent_child_relationships for all using(parent_id=auth.uid()) with check(parent_id=auth.uid());
create policy "adult self or guardian review" on public.trusted_adults for select using(profile_id=auth.uid() or exists(select 1 from trusted_adult_authorizations a where a.adult_id=profile_id and a.parent_id=auth.uid()));
create policy "adult self reads authorizations" on public.trusted_adult_authorizations for select using(parent_id=auth.uid() or adult_id=auth.uid());
create policy "parent manages authorizations" on public.trusted_adult_authorizations for all using(parent_id=auth.uid()) with check(parent_id=auth.uid());
create policy "spaces available to signed in users" on public.play_spaces for select to authenticated using(true);
create policy "guardian manages approved zones" on public.approved_play_zones for all using(parent_id=auth.uid() and public.is_parent_of(child_id)) with check(parent_id=auth.uid() and public.is_parent_of(child_id));
create policy "group visible to members" on public.play_groups for select using(exists(select 1 from group_memberships m where m.group_id=id and m.profile_id=auth.uid() and m.state='approved'));
create policy "member reads own membership" on public.group_memberships for select using(profile_id=auth.uid());
create policy "friend parties read relationship" on public.friendships for select using(requester_id=auth.uid() or recipient_id=auth.uid());
create policy "session discover only approved participants" on public.play_sessions for select using(state in ('approved','active') and exists(select 1 from session_participants p where p.session_id=id and (p.child_id=auth.uid() or public.is_parent_of(p.child_id) or public.is_session_supervisor(id))));
create policy "guardian or supervisor reads session" on public.play_sessions for select using(public.is_session_supervisor(id) or exists(select 1 from session_participants p where p.session_id=id and public.is_parent_of(p.child_id)));
create policy "session creator proposes" on public.play_sessions for insert with check(created_by=auth.uid());
create policy "creator edits draft" on public.play_sessions for update using(created_by=auth.uid() and state in ('draft','pending_parent_approval')) with check(created_by=auth.uid());
create policy "participants see own or guardian participants" on public.session_participants for select using(child_id=auth.uid() or public.is_parent_of(child_id) or public.is_session_supervisor(session_id));
create policy "child requests participation" on public.session_participants for insert with check(child_id=auth.uid() and state='pending');
create policy "parent approves participation" on public.session_approvals for all using(parent_id=auth.uid() and public.is_parent_of(child_id)) with check(parent_id=auth.uid() and public.is_parent_of(child_id));
create policy "read missions" on public.missions for select to authenticated using(active);
create policy "child reads own mission history" on public.mission_completions for select using(child_id=auth.uid() or public.is_parent_of(child_id));
create policy "read active challenges" on public.challenges for select to authenticated using(active);
create policy "child sees own challenge" on public.challenge_participants for select using(child_id=auth.uid() or public.is_parent_of(child_id));
create policy "read badge catalogue" on public.badges for select to authenticated using(true);
create policy "child or guardian reads badges" on public.user_badges for select using(profile_id=auth.uid() or public.is_parent_of(profile_id));
create policy "child or guardian reads rewards" on public.reward_transactions for select using(child_id=auth.uid() or public.is_parent_of(child_id));
create policy "recipient reads notifications" on public.notifications for select using(recipient_id=auth.uid());
create policy "recipient marks notification read" on public.notifications for update using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());
create policy "authorized session event read" on public.session_event_logs for select using(public.is_session_supervisor(session_event_logs.session_id) or exists(select 1 from session_participants p where p.session_id=session_event_logs.session_id and public.is_parent_of(p.child_id)));

-- Production writes for approvals, lifecycle transitions, notifications, and rewards must go through
-- trusted server-side RPCs/Edge Functions. Do not expose the service key in a client bundle.
-- Unique mission_completions and reward_transactions.mission_completion_id enforce idempotency.
