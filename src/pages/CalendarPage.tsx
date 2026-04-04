import { Link } from 'react-router-dom';

export default function CalendarPage() {
  // Дни недели
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  // Фейковая генерация 30 дней (Апрель)
  // Первое число апреля 2026 выпадает на среду, поэтому делаем 2 пустых слота в начале
  const emptyDays = [null, null]; 
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-title">Календарь дедлайнов</h2>
      </div>

      <div className="calendar-wrapper">
        <div className="calendar-header-nav">
          <button className="btn-secondary" style={{ padding: '6px 12px' }}>&larr;</button>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Апрель 2026</h3>
          <button className="btn-secondary" style={{ padding: '6px 12px' }}>&rarr;</button>
        </div>

        <div className="calendar-grid">
          {/* Шапка с днями недели */}
          {weekDays.map(day => (
            <div key={day} className="calendar-day-name">{day}</div>
          ))}

          {/* Пустые ячейки (понедельник, вторник) */}
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty"></div>
          ))}

          {/* Дни месяца */}
          {daysInMonth.map(day => {
            // Фейковая логика: помечаем 4 число как "сегодня", а 15-е как день с двумя дедлайнами
            const isToday = day === 4;
            const hasDeadlines = day === 15;
            const hasCompletedTask = day === 10;

            return (
              <div key={day} className={`calendar-day ${isToday ? 'today' : ''}`}>
                <div className="day-number">{day}</div>
                
                {/* Если сегодня, рисуем горящий дедлайн */}
                {isToday && (
                  <Link to="/tasks/101" className="calendar-event-pill">
                    Презентация UniFlow
                  </Link>
                )}

                {/* Выполненная задача в прошлом */}
                {hasCompletedTask && (
                  <Link to="/tasks/103" className="calendar-event-pill done">
                    Лабораторная №1
                  </Link>
                )}

                {/* Несколько дедлайнов в один день */}
                {hasDeadlines && (
                  <>
                    <Link to="/tasks/102" className="calendar-event-pill">
                      Эссе по истории
                    </Link>
                    <Link to="/tasks/104" className="calendar-event-pill">
                      Тест по матану
                    </Link>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3 className="section-title">Предстоящие события списком</h3>
        <div className="task-list">
          <Link to="/tasks/101" className="task-item">
            <div style={{ fontWeight: '500' }}>Презентация UniFlow</div>
            <div className="deadline-badge urgent">Сегодня 23:59</div>
          </Link>
          <Link to="/tasks/102" className="task-item">
            <div style={{ fontWeight: '500' }}>Эссе по истории</div>
            <div className="deadline-badge">15 апреля 12:00</div>
          </Link>
        </div>
      </div>
    </div>
  );
}