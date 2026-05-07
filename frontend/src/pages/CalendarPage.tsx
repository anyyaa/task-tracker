import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { isUrgentDeadline } from '../utils/deadlines';

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

type CalendarTask = {
  id: string;
  title: string;
  deadline: string;
  is_completed: boolean;
  course_id: string;
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      setError('');

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        const userId = sessionData.session?.user.id;

        if (!userId) {
          setTasks([]);
          return;
        }

        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('id')
            .eq('user_id', userId);

        if (coursesError) {
          throw coursesError;
        }

        const courseIds = (courses ?? []).map((course) => course.id);

        if (courseIds.length === 0) {
          setTasks([]);
          return;
        }

        const { data, error } = await supabase
            .from('tasks')
            .select('id, title, deadline, is_completed, course_id')
            .in('course_id', courseIds)
            .not('deadline', 'is', null)
            .order('deadline', { ascending: true });

        if (error) {
          throw error;
        }

        setTasks((data ?? []) as CalendarTask[]);
      } catch (error) {
        console.error('Ошибка загрузки задач для календаря:', error);
        setError('Не удалось загрузить задачи');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);


  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstWeekDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = lastDay.getDate();

    return [
      ...Array.from({ length: firstWeekDay }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [year, month]);

  const getDateKey = (dateValue: string | Date) => {
    const date = new Date(dateValue);

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };


  const tasksByDate = useMemo(() => {
    return tasks.reduce<Record<string, CalendarTask[]>>((acc, task) => {
      const dateKey = getDateKey(task.deadline);

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    const now = new Date();

    return tasks
        .filter((task) => new Date(task.deadline) >= now)
        .slice(0, 5);
  }, [tasks]);

  const formatDeadline = (deadline: string) => {
    return new Date(deadline).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formatMonth = currentDate.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });

  const todayKey = getDateKey(new Date());

  return (
      <div className="container">
        <div className="page-header">
          <h2 className="page-title">Календарь дедлайнов</h2>
        </div>

        <div className="calendar-wrapper">
          <div className="calendar-header-nav">
            <button className="btn-secondary" onClick={goToPreviousMonth}>
              &larr;
            </button>

            <h3 style={{margin: 0, fontSize: '18px', textTransform: 'capitalize'}}>
              {formatMonth}
            </h3>

            <button className="btn-secondary" onClick={goToNextMonth}>
              &rarr;
            </button>
          </div>

          {loading && <p>Загрузка календаря...</p>}
          {error && <p style={{color: 'var(--color-primary)'}}>{error}</p>}
          {!loading && !error && (
              <div className="calendar-grid">
                {weekDays.map((day) => (
                    <div key={day} className="calendar-day-name">
                      {day}
                    </div>
                ))}

                {calendarDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="calendar-day empty"/>;
                  }

                  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                  const isToday = dateKey === todayKey;

                  const dayTasks = tasksByDate[dateKey] ?? [];

                  return (
                      <div key={dateKey} className={`calendar-day ${isToday ? 'today' : ''}`}>
                        <div className="day-number">{day}</div>
                        {dayTasks.map((task) => (
                            <Link
                                key={task.id}
                                to={`/tasks/${task.id}`}
                                className={[
                                  'calendar-event-pill',
                                  task.is_completed ? 'done' : '',
                                  !task.is_completed && isUrgentDeadline(task.deadline) ? 'urgent' : '',
                                ].join(' ')}
                                title={task.title}
                            >
                              {!task.is_completed && isUrgentDeadline(task.deadline) && (
                                  <span className="calendar-event-alert">!</span>
                              )}
                              {task.title}
                            </Link>
                        ))}
                      </div>
                  );
                })}
              </div>
          )}
        </div>
        <div style={{marginTop: '20px'}}>
          <h3 className="section-title">Ближайшие дедлайны</h3>

          <div className="task-list">
            {upcomingTasks.length === 0 && <p style={{margin: 10}}>Ближайших дедлайнов нет</p>}

            {upcomingTasks.map((task) => (
                <Link key={task.id} to={`/tasks/${task.id}`} className="task-item">
                  <div style={{fontWeight: 500}}>{task.title}</div>
                  <div className={`deadline-badge ${task.is_completed ? '' : 'urgent'}`}>
                    {task.is_completed ? 'Выполнено' : formatDeadline(task.deadline)}
                  </div>
                </Link>
            ))}
          </div>
        </div>

      </div>
  );
}
