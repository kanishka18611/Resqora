create or replace function public.my_guardian_links()
returns table (
  emergency_id uuid,
  token text,
  victim_name text,
  emergency_status text,
  started_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    gs.emergency_id,
    gs.token,
    coalesce(p.full_name, 'RESQORA member') as victim_name,
    e.status::text as emergency_status,
    e.started_at
  from public.guardian_sessions gs
  join public.emergencies e on e.id = gs.emergency_id
  left join public.profiles p on p.id = gs.user_id
  where gs.active
    and (gs.expires_at is null or gs.expires_at > now())
    and e.status not in ('resolved', 'cancelled')
    and gs.guardian_email is not null
    and lower(gs.guardian_email) = lower(nullif(auth.jwt() ->> 'email', ''))
  order by e.started_at desc
  limit 5
$$;

revoke all on function public.my_guardian_links() from public;
revoke all on function public.my_guardian_links() from anon;
grant execute on function public.my_guardian_links() to authenticated;