import { useEffect, useState } from 'react';
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
      }

      setLoading(false);
    };

    fetchTask();
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
    setErrorMessage('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (!task) return;

    setEditTitle(task.title || '');
    setEditDescription(task.description || '');
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
    setIsEditing(false);
    setIsSavingTask(false);
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
            <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>
              {task.title}
            </h2>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`deadline-badge ${isUrgent(task.deadline) ? 'urgent' : ''}`}>
                {task.deadline ? `Дедлайн: ${formatDeadline(task.deadline)}` : 'Без срока'}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                Статус: {task.is_completed ? 'Выполнена' : 'В работе'}
              </span>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={toggleTaskStatus}
            disabled={isUpdatingStatus}
            style={{
              opacity: isUpdatingStatus ? 0.7 : 1,
              cursor: isUpdatingStatus ? 'not-allowed' : 'pointer',
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
          <p>
            {task.description?.trim()
              ? task.description
              : '[Здесь будет подробное описание задачи.]'}
          </p>
          {!task.description?.trim() && (
            <p>
              [Например: Необходимо подготовить презентацию для защиты проекта. Текст для слайдов
              должен быть написан до вечера пятницы, чтобы успеть собрать дизайн.]
            </p>
          )}
        </div>

        <div>
          <h3 className="section-title">Вложения и ссылки</h3>
          <div className="attachment-list">
            <a href="#" className="attachment-item" onClick={(e) => e.preventDefault()}>
              <span style={{ fontSize: '20px' }}>📄</span>
              <span>[Здесь будет прикрепленный файл: Методичка.pdf]</span>
            </a>

            <a href="#" className="attachment-item" onClick={(e) => e.preventDefault()}>
              <span style={{ fontSize: '20px' }}>🔗</span>
              <span>[Здесь будет ссылка: Google Документ с черновиком]</span>
            </a>

            <button
              className="btn-secondary"
              style={{ width: 'fit-content', marginTop: '10px', opacity: 0.6, cursor: 'not-allowed' }}
              disabled
            >
              + Прикрепить файл/ссылку
            </button>
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
          {!isEditing &&
          <button
            className="btn-secondary"
            onClick={deleteTask}
            disabled={isDeletingTask}
            style={{
              color: '#d32f2f',
              borderColor: '#ffcdd2',
              opacity: isDeletingTask ? 0.6 : 1,
              cursor: isDeletingTask ? 'not-allowed' : 'pointer',
            }}
          >
            {isDeletingTask ? 'Удаление...' : 'Удалить задачу'}
          </button>
          }
        </div>
      </div>
    </div>
  );
}