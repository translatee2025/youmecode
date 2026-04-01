
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON tenants FOR SELECT USING (true);

ALTER TABLE category_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON category_packages FOR SELECT USING (true);

ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform admin self access" ON platform_admins FOR SELECT USING (auth.uid() = id);
