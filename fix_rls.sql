CREATE POLICY "Allow authenticated update to audit_reports" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'audit_reports');
CREATE POLICY "Allow authenticated delete to audit_reports" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'audit_reports');
