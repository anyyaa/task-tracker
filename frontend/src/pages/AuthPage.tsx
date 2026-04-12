import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        navigate('/courses');
      }
    };

    checkSession();
  }, [navigate]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');

    if (!isLogin) {
      if (!email.trim()) {
        setError('Введите email');
        return;
      }

      if (!password.trim()) {
        setError('Введите пароль');
        return;
      }

      if (!firstName.trim()) {
        setError('Введите имя');
        return;
      }

      if (!lastName.trim()) {
        setError('Введите фамилию');
        return;
      }

      if (!confirmPassword.trim()) {
        setError('Повторите пароль');
        return;
      }

      if (password !== confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }

      try {
        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            },
          },
        });

        if (error) {
          setError(error.message);
          return;
        }

        if (data.user) {
          resetForm();
          navigate('/courses');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка регистрации');
      } finally {
        setLoading(false);
      }

      return;
    }

    if (!email.trim()) {
      setError('Введите email');
      return;
    }

    if (!password.trim()) {
      setError('Введите пароль');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        resetForm();
        navigate('/courses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
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
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
          </div>

          <div className="input-group">
            <label>Пароль</label>
            <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
          </div>
          {!isLogin && (
              <>
                <div className="input-group">
                  <label>Имя</label>
                  <input
                      type="text"
                      placeholder="Имя"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                  />
                </div>

                <div className="input-group">
                  <label>Фамилия</label>
                  <input
                      type="text"
                      placeholder="Фамилия"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                  />
                </div>
              </>
          )}

          {/* Это поле покажется только если мы на вкладке регистрации */}
          {!isLogin && (
            <div className="input-group">
              <label>Повторите пароль</label>
              <input
                  type="password"
                  placeholder="Повторите пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
              />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button
              type="button"
            className="btn-link"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                resetForm();
              }}
          >
            {isLogin ? 'Создать' : 'Войти'}
          </button>
        </div>
      </div>
    </div>
  );
}