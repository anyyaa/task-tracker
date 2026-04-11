create table if not exists task_attachments 
(id uuid PRIMARY KEY,
task_id uuid NOT NULL references tasks(id) ON delete cascade on update cascade,
name TEXT NOT NULL,
url TEXT NOT NULL,
is_external BOOLEAN DEFAULT false,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE INDEX idx_task_id ON task_attachments(task_id);