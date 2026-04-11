CREATE INDEX IF NOT EXISTS idx_task ON tasks(course_id);
CREATE INDEX IF NOT EXISTS idx_task_attachment ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_course ON courses(user_id); 
CREATE INDEX IF NOT EXISTS idx_course_attachment ON course_attachments(course_id);
