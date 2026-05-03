import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { log } from "../utils/logger";

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  deadline: string | null;
  course_id: string;
  description?: string | null;
}

interface CourseAttachment {
  id: string;
  course_id: string;
  name: string;
  url: string;
  is_external: boolean;
  publicUrl: string;
}

export default function CourseDetails() {
  const { id } = useParams();

  const [courseName, setCourseName] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attachments, setAttachments] = useState<CourseAttachment[]>([]);

  const [loading, setLoading] = useState(true);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  const [newAttachmentLink, setNewAttachmentLink] = useState('');
  const [selectedAttachmentFile, setSelectedAttachmentFile] = useState<File | null>(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [attachmentsError, setAttachmentsError] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);

  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);

  const attachmentFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    log("info", "page_open", "Открыта страница курса", { courseId: id });
    const fetchTasks = async () => {
      setLoading(true);
      setErrorMessage('');

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('name')
        .eq('id', id)
        .single();

      if (courseError) {
        console.error('Ошибка загрузки курса:', courseError);
      } else {
        setCourseName(courseData?.name || '');
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('course_id', id)
        .order('deadline', { ascending: true, nullsFirst: false });

      if (error) {
        log("error", "tasks_load_failed", error.message, { courseId: id });
        console.error('Ошибка загрузки задач:', error);
        setErrorMessage('Не удалось загрузить задачи. Попробуйте обновить страницу.');
        setTasks([]);
      } else {
        setTasks(data || []);
        log("info", "tasks_loaded", "Загружены задачи", count: data?.length || 0,});
      }

      setLoading(false);
    };

    if (id) {
      fetchTasks();
    } else {
      setErrorMessage('Не найден id курса.');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!id) {
        setAttachmentsError('Не найден id курса.');
        setAttachmentsLoading(false);
        return;
      }

      setAttachmentsLoading(true);
      setAttachmentsError('');

      const { data, error } = await supabase
        .from('course_attachments')
        .select('*')
        .eq('course_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки файлов курса:', error);
        setAttachmentsError('Не удалось загрузить материалы курса.');
        setAttachments([]);
        setAttachmentsLoading(false);
        return;
      }

      const mappedAttachments: CourseAttachment[] = (data || []).map((item: any) => {
        let publicUrl = item.url;

        if (!item.is_external) {
          const { data: publicData } = supabase.storage
            .from('file_attachments')
            .getPublicUrl(item.url);

          publicUrl = publicData.publicUrl;
        }

        return {
          id: item.id,
          course_id: item.course_id,
          name: item.name,
          url: item.url,
          is_external: item.is_external,
          publicUrl,
        };
      });

      setAttachments(mappedAttachments);
      setAttachmentsLoading(false);
    };

    fetchAttachments();
  }, [id]);

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return 'Без срока';

    const date = new Date(deadline);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUrgent = (deadline: string | null) => {
    if (!deadline) return false;
    const diff = new Date(deadline).getTime() - Date.now();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  };

  const isValidUrl = (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) {
      setErrorMessage('Введите название задачи.');
      return;
    }

    if (!id) {
      setErrorMessage('Не найден id курса.');
      return;
    }

    setErrorMessage('');
    setIsAddingTask(true);

    const normalizedTitle = newTaskTitle.trim();
    const normalizedDeadline = newTaskDeadline || null;

    const { data: existingTask, error: duplicateCheckError } = await supabase
        .from('tasks')
        .select('id')
        .eq('course_id', id)
        .eq('title', normalizedTitle)
        .eq('deadline', normalizedDeadline)
        .maybeSingle();

    if (duplicateCheckError) {
      setErrorMessage('Ошибка проверки дубликата задачи: ' + duplicateCheckError.message);
      setIsAddingTask(false);
      return;
    }

    if (existingTask) {
      setErrorMessage('Задача с таким названием и дедлайном уже существует.');
      setIsAddingTask(false);
      return;
    }

    const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: normalizedTitle,
            course_id: id,
            is_completed: false,
            deadline: normalizedDeadline,
          },
        ])
        .select()
        .single();

    if (error) {
      setErrorMessage('Ошибка создания задачи: ' + error.message);
    } else if (data) {
      setTasks((prevTasks) => [data, ...prevTasks]);
      setNewTaskTitle('');
      setNewTaskDeadline('');
    }

    setIsAddingTask(false);
  };

  const addAttachment = async () => {
    if (!id) {
      setAttachmentsError('Не найден id курса.');
      return;
    }

    if (!selectedAttachmentFile && !newAttachmentLink.trim()) {
      setAttachmentsError('Выберите файл или введите ссылку.');
      return;
    }

    if (newAttachmentLink.trim() && !isValidUrl(newAttachmentLink.trim())) {
      setAttachmentsError('Введите корректную ссылку. Она должна начинаться с http:// или https://');
      return;
    }

    setAttachmentsError('');
    setIsAddingAttachment(true);

    if (selectedAttachmentFile) {
      const safeFileName = selectedAttachmentFile.name
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '_');

      const filePath = `courses/${id}/${Date.now()}_${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('file_attachments')
        .upload(filePath, selectedAttachmentFile);

      if (uploadError) {
        setAttachmentsError('Файл не загрузился: ' + uploadError.message);
        setIsAddingAttachment(false);
        return;
      }

      const { data: insertedAttachment, error: attachmentError } = await supabase
        .from('course_attachments')
        .insert([
          {
            id: crypto.randomUUID(),
            course_id: id,
            name: selectedAttachmentFile.name,
            url: filePath,
            is_external: false,
          },
        ])
        .select()
        .single();

      if (attachmentError) {
        setAttachmentsError('Файл загружен, но запись не сохранилась: ' + attachmentError.message);
        setIsAddingAttachment(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from('file_attachments')
        .getPublicUrl(filePath);

      setAttachments((prev) => [
        {
          ...insertedAttachment,
          publicUrl: publicData.publicUrl,
        },
        ...prev,
      ]);

      setSelectedAttachmentFile(null);
      if (attachmentFileInputRef.current) {
        attachmentFileInputRef.current.value = '';
      }
    }

    if (newAttachmentLink.trim()) {
      const cleanLink = newAttachmentLink.trim();

      const { data: insertedLink, error: linkError } = await supabase
        .from('course_attachments')
        .insert([
          {
            id: crypto.randomUUID(),
            course_id: id,
            name: cleanLink,
            url: cleanLink,
            is_external: true,
          },
        ])
        .select()
        .single();

      if (linkError) {
        setAttachmentsError('Ссылка не сохранилась: ' + linkError.message);
        setIsAddingAttachment(false);
        return;
      }

      setAttachments((prev) => [
        {
          ...insertedLink,
          publicUrl: cleanLink,
        },
        ...prev,
      ]);

      setNewAttachmentLink('');
    }

    setIsAddingAttachment(false);
  };

  const deleteAttachment = async (attachment: CourseAttachment) => {
    const confirmed = window.confirm('Удалить материал курса?');
    if (!confirmed) return;

    setAttachmentsError('');
    setDeletingAttachmentId(attachment.id);

    if (!attachment.is_external) {
      const { error: storageError } = await supabase.storage
        .from('file_attachments')
        .remove([attachment.url]);

      if (storageError) {
        setAttachmentsError('Не удалось удалить файл из хранилища: ' + storageError.message);
        setDeletingAttachmentId(null);
        return;
      }
    }

    const { error } = await supabase
      .from('course_attachments')
      .delete()
      .eq('id', attachment.id);

    if (error) {
      setAttachmentsError('Не удалось удалить материал курса: ' + error.message);
    } else {
      setAttachments((prev) => prev.filter((item) => item.id !== attachment.id));
    }

    setDeletingAttachmentId(null);
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    setErrorMessage('');
    setTogglingTaskId(taskId);

    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', taskId);

    if (error) {
      setErrorMessage('Ошибка обновления задачи: ' + error.message);
    } else {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, is_completed: !currentStatus } : task
        )
      );
    }

    setTogglingTaskId(null);
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Удалить задачу?')) return;

    setErrorMessage('');
    setDeletingTaskId(taskId);

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      setErrorMessage('Ошибка удаления задачи: ' + error.message);
    } else {
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    }

    setDeletingTaskId(null);
  };

  if (loading) {
    return (
      <div className="container">
        <Link to="/courses" className="back-link">
          &larr; Назад к списку курсов
        </Link>

        <p style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          Загрузка задач...
        </p>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/courses" className="back-link">
        &larr; Назад к списку курсов
      </Link>

      <div className="course-header-flex">
        <div>
          <h2 className="page-title">{courseName || `Курс ID: ${id}`}</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Управляйте задачами этого курса
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isAddingTask) {
                addTask();
              }
            }}
            placeholder="Название задачи"
            disabled={isAddingTask}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
              opacity: isAddingTask ? 0.7 : 1,
            }}
          />

          <input
            type="datetime-local"
            value={newTaskDeadline}
            onChange={(e) => setNewTaskDeadline(e.target.value)}
            disabled={isAddingTask}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
              opacity: isAddingTask ? 0.7 : 1,
            }}
          />

          <button
            className="btn-primary"
            onClick={addTask}
            disabled={isAddingTask}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              opacity: isAddingTask ? 0.7 : 1,
              cursor: isAddingTask ? 'not-allowed' : 'pointer',
            }}
          >
            {isAddingTask ? 'Добавление...' : '+ Добавить задачу'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            marginTop: '16px',
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(255, 80, 80, 0.12)',
            border: '1px solid rgba(255, 80, 80, 0.35)',
            color: '#ff6b6b',
          }}
        >
          {errorMessage}
        </div>
      )}

      <div
        className="content-card"
        style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <h3 style={{ margin: 0 }}>Материалы курса</h3>

        {attachmentsError && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(255, 80, 80, 0.12)',
              border: '1px solid rgba(255, 80, 80, 0.35)',
              color: '#ff6b6b',
            }}
          >
            {attachmentsError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            value={newAttachmentLink}
            onChange={(e) => setNewAttachmentLink(e.target.value)}
            placeholder="Добавить ссылку на материал курса"
            disabled={isAddingAttachment}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
              opacity: isAddingAttachment ? 0.7 : 1,
            }}
          />

          <div className="file-upload-wrapper">
            <label className="file-upload-button">
              <span className="icon">📎</span>
              {selectedAttachmentFile ? 'Файл выбран' : 'Выбрать файл'}
              <input
                ref={attachmentFileInputRef}
                type="file"
                className="file-upload-input"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedAttachmentFile(file);
                }}
                disabled={isAddingAttachment}
              />
            </label>
            {selectedAttachmentFile && (
              <span className="file-selected-name" title={selectedAttachmentFile.name}>
                {selectedAttachmentFile.name}
              </span>
            )}
          </div>

          {selectedAttachmentFile && (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Выбран файл: {selectedAttachmentFile.name}
            </div>
          )}

          <div>
            <button
              className="btn-primary"
              onClick={addAttachment}
              disabled={isAddingAttachment}
              style={{
                opacity: isAddingAttachment ? 0.7 : 1,
                cursor: isAddingAttachment ? 'not-allowed' : 'pointer',
              }}
            >
              {isAddingAttachment ? 'Добавление...' : 'Добавить материал'}
            </button>
          </div>
        </div>

        {attachmentsLoading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Загрузка материалов курса...</p>
        ) : attachments.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>
            У этого курса пока нет прикреплённых файлов.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {attachments.map((attachment) => {
              const isDeletingThisAttachment = deletingAttachmentId === attachment.id;

              return (
                <div
                  key={attachment.id}
                  className="attachment-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <a
                    href={attachment.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      textDecoration: 'none',
                      color: 'var(--color-text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexGrow: 1,
                      opacity: isDeletingThisAttachment ? 0.5 : 1,
                      pointerEvents: isDeletingThisAttachment ? 'none' : 'auto',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>
                      {attachment.is_external ? '🔗' : '📎'}
                    </span>
                    <span>{attachment.name}</span>
                  </a>

                  <button
                    onClick={() => deleteAttachment(attachment)}
                    disabled={isDeletingThisAttachment}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#d32f2f',
                      cursor: isDeletingThisAttachment ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      padding: '4px 8px',
                      opacity: isDeletingThisAttachment ? 0.5 : 1,
                    }}
                    title="Удалить материал"
                  >
                    {isDeletingThisAttachment ? '...' : '🗑️'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="task-list">
        {tasks.length === 0 ? (
          <p
            style={{
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              padding: '40px',
            }}
          >
            Нет задач. Создайте первую!
          </p>
        ) : (
          tasks.map((task) => {
            const isDeletingThisTask = deletingTaskId === task.id;
            const isTogglingThisTask = togglingTaskId === task.id;
            const isBusy = isDeletingThisTask || isTogglingThisTask;

            return (
              <div
                key={task.id}
                className="task-item"
                style={{
                  opacity: task.is_completed ? 0.6 : 1,
                }}
              >
                <div className="task-main">
                  <div
                    className={`task-checkbox ${task.is_completed ? 'done' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isBusy) {
                        toggleTask(task.id, task.is_completed);
                      }
                    }}
                    style={{
                      cursor: isBusy ? 'not-allowed' : 'pointer',
                      opacity: isTogglingThisTask ? 0.5 : 1,
                      pointerEvents: isBusy ? 'none' : 'auto',
                    }}
                  ></div>

                  <Link
                    to={`/tasks/${task.id}`}
                    style={{
                      fontWeight: '500',
                      textDecoration: task.is_completed ? 'line-through' : 'none',
                      color: 'var(--color-text)',
                      pointerEvents: isDeletingThisTask ? 'none' : 'auto',
                      opacity: isDeletingThisTask ? 0.5 : 1,
                    }}
                  >
                    {task.title}
                  </Link>
                </div>

                <div
                  className="task-meta"
                  style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <div className={`deadline-badge ${isUrgent(task.deadline) ? 'urgent' : ''}`}>
                    {task.is_completed ? '[Выполнено]' : formatDeadline(task.deadline)}
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isDeletingThisTask) {
                        deleteTask(task.id);
                      }
                    }}
                    disabled={isDeletingThisTask}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: isDeletingThisTask ? 'not-allowed' : 'pointer',
                      fontSize: '18px',
                      padding: '4px 8px',
                      opacity: isDeletingThisTask ? 0.5 : 1,
                    }}
                    title="Удалить задачу"
                  >
                    {isDeletingThisTask ? '...' : '🗑️'}
                  </button>

                  <Link
                    to={`/tasks/${task.id}`}
                    style={{
                      color: 'var(--color-text-muted)',
                      pointerEvents: isDeletingThisTask ? 'none' : 'auto',
                      opacity: isDeletingThisTask ? 0.5 : 1,
                    }}
                  >
                    &rarr;
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
