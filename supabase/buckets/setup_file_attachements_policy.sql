CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'file_attachments' );

CREATE POLICY "Auth Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'file_attachments' );

CREATE POLICY "Auth Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'file_attachments' );

CREATE POLICY "Auth Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'file_attachments' );