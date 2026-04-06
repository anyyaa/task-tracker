import { Link, useParams } from 'react-router-dom';

export default function CourseDetails() {
  const { id } = useParams();

  return (
    <div className="container">
      <Link to="/courses" className="back-link">&larr; Назад к списку курсов</Link>
      
      <div className="course-header-flex">
        <div>
          <h2 className="page-title">[Здесь будет Название курса ID: {id}]</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
            [Здесь будет описание курса]
          </p>
        </div>
        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
          + Добавить задачу
        </button>
      </div>

      <div className="task-list">
        {/* Заглушка: Невыполненная задача с горящим дедлайном */}
        <Link to="/tasks/101" className="task-item">
          <div className="task-main">
            <div className="task-checkbox"></div>
            <div style={{ fontWeight: '500' }}>[Здесь будет Название задачи 1]</div>
          </div>
          <div className="task-meta">
            <div className="deadline-badge urgent">[Завтра 23:59]</div>
            <span>&rarr;</span>
          </div>
        </Link>

        {/* Заглушка: Обычная задача */}
        <Link to="/tasks/102" className="task-item">
          <div className="task-main">
            <div className="task-checkbox"></div>
            <div style={{ fontWeight: '500' }}>[Здесь будет Название задачи 2]</div>
          </div>
          <div className="task-meta">
            <div className="deadline-badge">[15 апреля 12:00]</div>
            <span>&rarr;</span>
          </div>
        </Link>

        {/* Заглушка: Выполненная задача */}
        <Link to="/tasks/103" className="task-item" style={{ opacity: 0.6 }}>
          <div className="task-main">
            <div className="task-checkbox done"></div>
            <div style={{ fontWeight: '500', textDecoration: 'line-through' }}>
              [Здесь будет Выполненная задача]
            </div>
          </div>
          <div className="task-meta">
            <div className="deadline-badge">[Выполнено]</div>
            <span>&rarr;</span>
          </div>
        </Link>
      </div>
    </div>
  );
}