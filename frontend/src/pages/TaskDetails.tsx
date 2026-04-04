import { useParams, useNavigate } from 'react-router-dom';

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="container">
      {/* navigate(-1) возвращает пользователя на предыдущую страницу в истории браузера */}
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
              [Здесь будет Название задачи ID: {id}]
            </h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span className="deadline-badge urgent">[Дедлайн: Завтра 23:59]</span>
              <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Статус: В работе</span>
            </div>
          </div>
          
          <button className="btn-primary">
            Отметить выполненной
          </button>
        </div>

        <div className="task-description">
          <p>[Здесь будет подробное описание задачи.]</p>
          <p>[Например: Необходимо подготовить презентацию для защиты проекта. Текст для слайдов должен быть написан до вечера пятницы, чтобы успеть собрать дизайн.]</p>
        </div>

        <div>
          <h3 className="section-title">Вложения и ссылки</h3>
          <div className="attachment-list">
            {/* Заглушка для файла */}
            <a href="#" className="attachment-item">
              <span style={{ fontSize: '20px' }}>📄</span>
              <span>[Здесь будет прикрепленный файл: Методичка.pdf]</span>
            </a>
            
            {/* Заглушка для ссылки */}
            <a href="#" className="attachment-item">
              <span style={{ fontSize: '20px' }}>🔗</span>
              <span>[Здесь будет ссылка: Google Документ с черновиком]</span>
            </a>
            
            <button className="btn-secondary" style={{ width: 'fit-content', marginTop: '10px' }}>
              + Прикрепить файл/ссылку
            </button>
          </div>
        </div>
        
        <div className="action-buttons">
          <button className="btn-secondary">Редактировать</button>
          <button className="btn-secondary" style={{ color: '#d32f2f', borderColor: '#ffcdd2' }}>
            Удалить задачу
          </button>
        </div>
      </div>
    </div>
  );
}