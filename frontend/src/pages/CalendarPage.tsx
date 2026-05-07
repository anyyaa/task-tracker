import { useMemo, useState } from 'react';

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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

  const todayKey = new Date().toISOString().slice(0, 10);

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

            <h3 style={{ margin: 0, fontSize: '18px', textTransform: 'capitalize' }}>
              {formatMonth}
            </h3>

            <button className="btn-secondary" onClick={goToNextMonth}>
              &rarr;
            </button>
          </div>

          <div className="calendar-grid">
            {weekDays.map((day) => (
                <div key={day} className="calendar-day-name">
                  {day}
                </div>
            ))}

            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="calendar-day empty" />;
              }

              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateKey === todayKey;

              return (
                  <div key={dateKey} className={`calendar-day ${isToday ? 'today' : ''}`}>
                    <div className="day-number">{day}</div>
                  </div>
              );
            })}
          </div>
        </div>
      </div>
  );
}
