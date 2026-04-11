create table if not exists course_attachments 
(id uuid PRIMARY KEY,
course_id uuid NOT NULL references courses(id) ON delete cascade on update cascade,
name TEXT NOT NULL,
url TEXT NOT NULL,
is_external BOOLEAN DEFAULT false,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE INDEX idx_course_id ON course_attachments(course_id);