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

  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('course_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки задач:', error);
      } else {
        setTasks(data || []);
      }
      setLoading(false);
    };

    if (id) fetchTasks();
  }, [id]);

  const addTask = async () => {
    if (!newTaskTitle.trim()) {
      alert('Введите название задачи');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Вы не авторизованы');
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title: newTaskTitle,
          course_id: id,
          user_id: user.id,
          is_completed: false,
        },
      ])
      .select()
      .single();

    if (error) {
      alert('Ошибка создания задачи: ' + error.message);
    } else if (data) {
      setTasks([data, ...tasks]);
      setNewTaskTitle('');
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', taskId);

    if (error) {
      alert('Ошибка обновления: ' + error.message);
    } else {
      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, is_completed: !currentStatus } : task
      ));
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Удалить задачу?')) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      alert('Ошибка удаления: ' + error.message);
    } else {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
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
        <p>Загрузка задач...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/courses" className="back-link">&larr; Назад к списку курсов</Link>

      <div className="course-header-flex">
        <div>
          <h2 className="page-title">Курс ID: {id}</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Управляйте задачами этого курса
          </p>
        </div>
        
        {/* Форма добавления задачи */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Название задачи"
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
            }}
          />
          <button className="btn-primary" onClick={addTask} style={{ padding: '8px 16px', fontSize: '14px' }}>
            + Добавить задачу
          </button>
        </div>
      </div>

      <div className="task-list">
        {tasks.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px' }}>
            Нет задач. Создайте первую!
          </p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="task-item" style={{ opacity: task.is_completed ? 0.6 : 1 }}>
              <div className="task-main">
                {/* Чекбокс для отметки выполнения */}
                <div
                  className={`task-checkbox ${task.is_completed ? 'done' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTask(task.id, task.is_completed);
                  }}
                  style={{ cursor: 'pointer' }}
                ></div>
                
                <Link
                  to={`/tasks/${task.id}`}
                  style={{
                    fontWeight: '500',
                    textDecoration: task.is_completed ? 'line-through' : 'none',
                    color: 'var(--color-text)',
                  }}
                >
                  {task.title}
                </Link>
              </div>
              
              <div className="task-meta" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={`deadline-badge ${isUrgent(task.deadline) ? 'urgent' : ''}`}>
                  {task.is_completed ? '[Выполнено]' : formatDeadline(task.deadline)}
                </div>
                
                {/* Кнопка удаления */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px 8px',
                  }}
                  title="Удалить задачу"
                >
                  🗑️
                </button>
                
                <Link to={`/tasks/${task.id}`} style={{ color: 'var(--color-text-muted)' }}>
                  &rarr;
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}