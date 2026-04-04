import { Link } from 'react-router-dom';

export default function CoursesPage() {
  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-title">Мои курсы</h2>
        {/* Можно продублировать кнопку создания здесь, если карточек станет очень много */}
        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
          + Новый курс
        </button>
      </div>

      <div className="courses-grid">
        {/* Карточка добавления нового курса (как элемент сетки) */}
        <div className="course-card course-card-add">
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>+</div>
          <div style={{ fontWeight: '500' }}>[Здесь будет кнопка / модалка "Создать курс"]</div>
        </div>

        {/* Заглушка для Карточки №1 */}
        <Link to="/courses/1" className="course-card">
          <div style={{ flexGrow: 1 }}>
            <h3 style={{ marginBottom: '10px', fontSize: '20px' }}>
              [Здесь будет Название курса 1]
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
              [Здесь будет краткое описание курса или имя преподавателя. Возможно, статистика по дедлайнам.]
            </p>
          </div>
          <div style={{ marginTop: '20px', fontSize: '13px', color: 'var(--color-primary)', fontWeight: '500' }}>
            Перейти к задачам &rarr;
          </div>
        </Link>

        {/* Заглушка для Карточки №2 */}
        <Link to="/courses/2" className="course-card">
          <div style={{ flexGrow: 1 }}>
            <h3 style={{ marginBottom: '10px', fontSize: '20px' }}>
              [Здесь будет Название курса 2]
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
              [Здесь будет краткое описание курса 2]
            </p>
          </div>
          <div style={{ marginTop: '20px', fontSize: '13px', color: 'var(--color-primary)', fontWeight: '500' }}>
            Перейти к задачам &rarr;
          </div>
        </Link>
      </div>
    </div>
  );
}