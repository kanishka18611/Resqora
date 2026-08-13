DO $do$
DECLARE r record; newdef text;
BEGIN
  FOR r IN
    SELECT p.oid, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
      AND pg_get_functiondef(p.oid) LIKE '%AEGIS%'
  LOOP
    newdef := replace(r.def, 'AEGIS', 'RESQORA');
    EXECUTE newdef;
  END LOOP;
END
$do$;

UPDATE public.notifications
SET title = replace(title, 'AEGIS', 'RESQORA'),
    body = replace(body, 'AEGIS', 'RESQORA')
WHERE title LIKE '%AEGIS%' OR body LIKE '%AEGIS%';