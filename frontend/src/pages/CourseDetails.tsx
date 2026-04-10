import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  deadline: string | null;
  course_id: string;
}

export default function CourseDetails() {
  const { id } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setErrorMessage('');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('course_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки задач:', error);
        setErrorMessage('Не удалось загрузить задачи. Попробуйте обновить страницу.');
        setTasks([]);
      } else {
        setTasks(data || []);
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

  const addTask = async () => {
    if (!newTaskTitle.trim()) {
      setErrorMessage('Введите название задачи.');
      return;
    }

    setErrorMessage('');
    setIsAddingTask(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage('Вы не авторизованы.');
      setIsAddingTask(false);
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title: newTaskTitle.trim(),
          course_id: id,
          user_id: user.id,
          is_completed: false,
        },
      ])
      .select()
      .single();

    if (error) {
      setErrorMessage('Ошибка создания задачи: ' + error.message);
    } else if (data) {
      setTasks((prevTasks) => [data, ...prevTasks]);
      setNewTaskTitle('');
    }

    setIsAddingTask(false);
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
          <h2 className="page-title">Курс ID: {id}</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Управляйте задачами этого курса
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
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