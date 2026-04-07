import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage'; // Импортируем нашу новую страницу
import './index.css';
import CoursesPage from './pages/CoursesPage';
import CourseDetails from './pages/CourseDetails';
import TaskDetails from './pages/TaskDetails';
import CalendarPage from './pages/CalendarPage';
import { supabase } from './lib/supabase';

function Navigation() {
  const location = useLocation();

    const navigate = useNavigate();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Ошибка выхода:', error.message);
            return;
        }

        navigate('/');
    };

  // Если мы на странице авторизации, шапку не показываем
  if (location.pathname === '/') return null;

  return (
    <header style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)', padding: '15px 0' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--color-primary)', fontSize: '24px' }}>UniFlow</h1>
        <nav style={{ display: 'flex', gap: '20px' }}>
          <Link to="/courses" style={{ textDecoration: 'none', color: 'var(--color-text-main)' }}>Курсы</Link>
            <button
                type="button"
                onClick={handleLogout}
                style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--color-text-main)',
                    font: 'inherit'
                }}
            >
                Выходf
            </button>
        </nav>
      </div>
    </header>
  );
}

function App() {
    return (
        <BrowserRouter>
            <Navigation/>
            <Routes>
                <Route path="/" element={<AuthPage/>}/>
                <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetails />} />
        <Route path="/tasks/:id" element={<TaskDetails />} />
        {/* НОВАЯ СТРОЧКА ДЛЯ КАЛЕНДАРЯ */}
        <Route path="/calendar" element={<CalendarPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;