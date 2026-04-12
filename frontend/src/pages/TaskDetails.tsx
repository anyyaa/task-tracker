import {useEffect, useRef, useState} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  deadline: string | null;
  course_id: string;
  description?: string | null;
}

interface TaskAttachment {
  id: string;
  task_id: string;
  name: string;
  url: string;
  is_external: boolean;
  publicUrl: string;
}

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [editDeadline, setEditDeadline] = useState('');

  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);
  const [attachmentsError, setAttachmentsError] = useState('');
  const [newAttachmentLink, setNewAttachmentLink] = useState('');
  const [selectedAttachmentFile, setSelectedAttachmentFile] = useState<File | null>(null);
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);


  const attachmentFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      if (!id) {
        setErrorMessage('Не найден id задачи.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage('');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Ошибка загрузки задачи:', error);
        setErrorMessage('Не удалось загрузить задачу.');
        setTask(null);
      } else {
        setTask(data);
        setEditTitle(data.title || '');
        setEditDescription(data.description || '');
        setEditDeadline(toDatetimeLocalValue(data.deadline));
      }

      setLoading(false);
    };

    fetchTask();
  }, [id]);

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!id) {
        setAttachmentsError('Не найден id задачи.');
        setAttachmentsLoading(false);
        return;
      }

      setAttachmentsLoading(true);
      setAttachmentsError('');

      const { data, error } = await supabase
          .from('task_attachments')
          .select('*')
          .eq('task_id', id)
          .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки файлов задачи:', error);
        setAttachmentsError('Не удалось загрузить вложения задачи.');
        setAttachments([]);
        setAttachmentsLoading(false);
        return;
      }

      const mappedAttachments: TaskAttachment[] = (data || []).map((item: any) => {
        let publicUrl = item.url;

        if (!item.is_external) {
          const { data: publicData } = supabase.storage
              .from('file_attachments')
              .getPublicUrl(item.url);

          publicUrl = publicData.publicUrl;
        }

        return {
          id: item.id,
          task_id: item.task_id,
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

  const toDatetimeLocalValue = (deadline: string | null) => {
    if (!deadline) return '';

    const date = new Date(deadline);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

  const toggleTaskStatus = async () => {
    if (!task || isUpdatingStatus) return;

    setErrorMessage('');
    setIsUpdatingStatus(true);

    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !task.is_completed })
      .eq('id', task.id);

    if (error) {
      setErrorMessage('Ошибка обновления статуса: ' + error.message);
    } else {
      setTask((prevTask) =>
        prevTask ? { ...prevTask, is_completed: !prevTask.is_completed } : prevTask
      );
    }

    setIsUpdatingStatus(false);
  };

  const startEditing = () => {
    if (!task) return;

    setEditTitle(task.title || '');
    setEditDescription(task.description || '');
    setEditDeadline(toDatetimeLocalValue(task.deadline));
    setErrorMessage('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (!task) return;

    setEditTitle(task.title || '');
    setEditDescription(task.description || '');
    setEditDeadline(toDatetimeLocalValue(task.deadline));
    setErrorMessage('');
    setIsEditing(false);
  };

  const saveTaskChanges = async () => {
    if (!task || isSavingTask) return;

    if (!editTitle.trim()) {
      setErrorMessage('Введите название задачи.');
      return;
    }

    setErrorMessage('');
    setIsSavingTask(true);

    const { data, error } = await supabase
        .from('tasks')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          deadline: editDeadline || null,
        })
        .eq('id', task.id)
        .select()
        .single();

    if (error) {
      setErrorMessage('Ошибка сохранения задачи: ' + error.message);
      setIsSavingTask(false);
      return;
    }

    setTask(data);
    setEditTitle(data.title || '');
    setEditDescription(data.description || '');
    setEditDeadline(toDatetimeLocalValue(data.deadline));
    setIsEditing(false);
    setIsSavingTask(false);
  };

  const addAttachment = async () => {
    if (!task) {
      setAttachmentsError('Не найдена задача.');
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

      const filePath = `tasks/${task.id}/${Date.now()}_${safeFileName}`;

      const { error: uploadError } = await supabase.storage
          .from('file_attachments')
          .upload(filePath, selectedAttachmentFile);

      if (uploadError) {
        setAttachmentsError('Файл не загрузился: ' + uploadError.message);
        setIsAddingAttachment(false);
        return;
      }

      const { data: insertedAttachment, error: attachmentError } = await supabase
          .from('task_attachments')
          .insert([
            {
              id: crypto.randomUUID(),
              task_id: task.id,
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
          .from('task_attachments')
          .insert([
            {
              id: crypto.randomUUID(),
              task_id: task.id,
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

  const deleteAttachment = async (attachment: TaskAttachment) => {
    const confirmed = window.confirm('Удалить материал задачи?');
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
        .from('task_attachments')
        .delete()
        .eq('id', attachment.id);

    if (error) {
      setAttachmentsError('Не удалось удалить материал задачи: ' + error.message);
    } else {
      setAttachments((prev) => prev.filter((item) => item.id !== attachment.id));
    }

    setDeletingAttachmentId(null);
  };
  
  const deleteTask = async () => {
    if (!task || isDeletingTask) return;

    const confirmed = window.confirm('Удалить задачу?');
    if (!confirmed) return;

    setErrorMessage('');
    setIsDeletingTask(true);

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id);

    if (error) {
      setErrorMessage('Ошибка удаления задачи: ' + error.message);
      setIsDeletingTask(false);
      return;
    }

    navigate(task.course_id ? `/courses/${task.course_id}` : '/courses');
  };

  if (loading) {
    return (
      <div className="container">
        <button
          onClick={() => navigate(-1)}
          className="btn-link"
          style={{ marginTop: '20px', marginBottom: '10px' }}
        >
          &larr; Назад к списку задач
        </button>

        <div className="content-card">
          <p style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
            Загрузка задачи...
          </p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container">
        <button
          onClick={() => navigate(-1)}
          className="btn-link"
          style={{ marginTop: '20px', marginBottom: '10px' }}
        >
          &larr; Назад к списку задач
        </button>

        <div className="content-card">
          <p style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
            Задача не найдена.
          </p>

          {errorMessage && (
            <div
              style={{
                marginTop: '16px',
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
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button
        onClick={() => navigate(-1)}
        className="btn-link"
        style={{ marginTop: '20px', marginBottom: '10px' }}
      >
        &larr; Назад к списку задач
      </button>

      <div className="content-card">
        <div className="task-detail-header">
          <div>
            {isEditing ? (
                <>
                  <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Название задачи"
                      disabled={isSavingTask}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-main)',
                        fontSize: '24px',
                        fontWeight: 700,
                        marginBottom: '10px',
                        opacity: isSavingTask ? 0.7 : 1,
                      }}
                  />

                  <input
                      type="datetime-local"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      disabled={isSavingTask}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-main)',
                        marginBottom: '10px',
                        opacity: isSavingTask ? 0.7 : 1,
                      }}
                  />
                </>
            ) : (
                <h2 style={{fontSize: '24px', marginBottom: '10px'}}>
                  {task.title}
                </h2>
            )}

            <div style={{display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'}}>
              <span className={`deadline-badge ${isUrgent(task.deadline) ? 'urgent' : ''}`}>
                {task.deadline ? `Дедлайн: ${formatDeadline(task.deadline)}` : 'Без срока'}
              </span>
              <span style={{fontSize: '14px', color: 'var(--color-text-muted)'}}>
                Статус: {task.is_completed ? 'Выполнена' : 'В работе'}
              </span>
            </div>
          </div>

          <button
              className="btn-primary"
              onClick={toggleTaskStatus}
              disabled={isUpdatingStatus || isEditing || isSavingTask}
              style={{
                opacity: isUpdatingStatus || isEditing || isSavingTask ? 0.7 : 1,
                cursor: isUpdatingStatus || isEditing || isSavingTask ? 'not-allowed' : 'pointer',
              }}
          >
            {isUpdatingStatus
                ? 'Сохраняем...'
                : task.is_completed
                    ? 'Отметить невыполненной'
                    : 'Отметить выполненной'}
          </button>
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

        <div className="task-description">
          {isEditing ? (
              <>
                <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 600,
                      color: 'var(--color-text-main)',
                    }}
                >
                  Описание
                </label>

                <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Введите описание задачи"
                    disabled={isSavingTask}
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-main)',
                      resize: 'vertical',
                      opacity: isSavingTask ? 0.7 : 1,
                    }}
                />
              </>
          ) : (
              <>
                <p
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {task.description}
                </p>
              </>
          )}
        </div>

        <div>
          <h3 className="section-title">Материалы задачи</h3>

          {attachmentsError && (
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
                {attachmentsError}
              </div>
          )}

          <div className="attachment-list" style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <input
                type="text"
                value={newAttachmentLink}
                onChange={(e) => setNewAttachmentLink(e.target.value)}
                placeholder="Добавить ссылку на материал задачи"
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

            <input
                ref={attachmentFileInputRef}
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedAttachmentFile(file);
                }}
                disabled={isAddingAttachment}
            />

            {selectedAttachmentFile && (
                <div style={{color: 'var(--color-text-muted)', fontSize: '14px'}}>
                  Выбран файл: {selectedAttachmentFile.name}
                </div>
            )}

            <div>
              <button
                  className="btn-secondary"
                  onClick={addAttachment}
                  disabled={isAddingAttachment}
                  style={{
                    width: 'fit-content',
                    marginTop: '10px',
                    opacity: isAddingAttachment ? 0.6 : 1,
                    cursor: isAddingAttachment ? 'not-allowed' : 'pointer',
                  }}
              >
                {isAddingAttachment ? 'Добавление...' : 'Добавить материал'}
              </button>
            </div>

            {attachmentsLoading ? (
                <p style={{color: 'var(--color-text-muted)'}}>Загрузка материалов задачи...</p>
            ) : attachments.length === 0 ? (
                <p style={{color: 'var(--color-text-muted)'}}>
                  У этой задачи пока нет прикреплённых материалов.
                </p>
            ) : (
                attachments.map((attachment) => {
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
              <span style={{fontSize: '20px'}}>
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
                })
            )}
          </div>
        </div>

        <div className="action-buttons">
          {isEditing ? (
              <>
                <button
                    className="btn-primary"
                    onClick={saveTaskChanges}
                    disabled={isSavingTask}
                    style={{
                      opacity: isSavingTask ? 0.7 : 1,
                      cursor: isSavingTask ? 'not-allowed' : 'pointer',
                    }}
                >
                  {isSavingTask ? 'Сохранение...' : 'Сохранить'}
                </button>

                <button
                    className="btn-secondary"
                    onClick={cancelEditing}
                    disabled={isSavingTask}
                    style={{
                      opacity: isSavingTask ? 0.7 : 1,
                      cursor: isSavingTask ? 'not-allowed' : 'pointer',
                    }}
                >
                  Отменить
                </button>
              </>
          ) : (
              <button
                  className="btn-secondary"
                  onClick={startEditing}
              >
                Редактировать
              </button>
          )}
          <button
              className="btn-secondary"
              onClick={deleteTask}
              disabled={isDeletingTask || isEditing || isSavingTask}
              style={{
                color: '#d32f2f',
                borderColor: '#ffcdd2',
                opacity: isDeletingTask || isEditing || isSavingTask ? 0.6 : 1,
                cursor: isDeletingTask || isEditing || isSavingTask ? 'not-allowed' : 'pointer',
                marginLeft: 'auto'
              }}
          >
            {isDeletingTask ? 'Удаление...' : 'Удалить задачу'}
          </button>
        </div>
      </div>
    </div>
  );
}