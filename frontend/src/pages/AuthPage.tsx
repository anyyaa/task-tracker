import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    navigate('/courses');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">UniFlow</h2>
        <p className="auth-subtitle">
          {isLogin ? 'Вход в систему' : 'Регистрация нового аккаунта'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="student@university.com" required />
          </div>

          <div className="input-group">
            <label>Пароль</label>
            <input type="password" placeholder="••••••••" required />
          </div>

          {/* Это поле покажется только если мы на вкладке регистрации */}
          {!isLogin && (
            <div className="input-group">
              <label>Повторите пароль</label>
              <input type="password" placeholder="••••••••" required />
            </div>
          )}

          <button type="submit" className="btn-primary">
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button 
            type="button" 
            className="btn-link"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Создать' : 'Войти'}
          </button>
        </div>
      </div>
    </div>
  );
}