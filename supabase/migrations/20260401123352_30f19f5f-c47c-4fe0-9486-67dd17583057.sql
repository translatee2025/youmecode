-- Allow anyone to insert into tenants (needed for first-time setup)
CREATE POLICY "Allow insert for setup" ON public.tenants FOR INSERT TO public WITH CHECK (true);

-- Allow anyone to update tenants (needed for onboarding completion)
CREATE POLICY "Allow update for setup" ON public.tenants FOR UPDATE TO public USING (true) WITH CHECK (true);