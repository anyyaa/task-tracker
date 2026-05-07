import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage'; // Импортируем нашу новую страницу
import './index.css';
import CoursesPage from './pages/CoursesPage';
import CourseDetails from './pages/CourseDetails';
import TaskDetails from './pages/TaskDetails';
import CalendarPage from './pages/CalendarPage';
import { supabase } from './lib/supabase';
import ProtectedRoute from './components/ProtectedRoute';
import {useEffect, useState} from "react";
function Navigation() {

    const location = useLocation();

    const navigate = useNavigate();

    const [fullName, setFullName] = useState('');

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Ошибка выхода:', error.message);
            return;
        }

        navigate('/');
    };

    const getNavLinkStyle = (path: string) => ({
        textDecoration: 'none',
        color: location.pathname.startsWith(path)
            ? 'var(--color-primary)'
            : 'var(--color-text-main)',
        fontWeight: location.pathname.startsWith(path) ? 700 : 500,
    });

    useEffect(() => {
        if (location.pathname === '/') {
            setFullName('');
            return;
        }

        let isMounted = true;

        const loadUserName = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (error) {
                    console.error('Ошибка получения сессии:', error.message);
                    setFullName('');
                    return;
                }

                const user = data.session?.user;

                const firstName = user?.user_metadata?.first_name ?? '';
                const lastName = user?.user_metadata?.last_name ?? '';

                setFullName(`${firstName} ${lastName}`.trim());
            } catch (error) {
                if (!isMounted) return;

                console.error('Ошибка загрузки имени пользователя:', error);
                setFullName('');
            }
        };

        loadUserName();

        return () => {
            isMounted = false;
        };
    }, [location.pathname]);

    // Если мы на странице авторизации, шапку не показываем
  if (location.pathname === '/') return null;

  return (
    <header style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)', padding: '15px 0' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--color-primary)', fontSize: '24px' }}>UniFlow</h1>
        <nav style={{ display: 'flex', gap: '20px' }}>
            <Link to="/courses" style={getNavLinkStyle('/courses')}>
                Курсы
            </Link>

            <Link to="/calendar" style={getNavLinkStyle('/calendar')}>
                Календарь
            </Link>
        {fullName && (
            <span
                style={{
                    color: 'var(--color-text-muted)',
                    paddingLeft: '20px',
                    borderLeft: '1px solid var(--color-border)',
                    whiteSpace: 'nowrap',
                }}
            >
                {fullName}
            </span>
        )}
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
            Выход
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
                <Route
                    path="/courses"
                    element={
                        <ProtectedRoute>
                            <CoursesPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/courses/:id"
                    element={
                        <ProtectedRoute>
                            <CourseDetails />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/tasks/:id"
                    element={
                        <ProtectedRoute>
                            <TaskDetails />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/calendar"
                    element={
                        <ProtectedRoute>
                            <CalendarPage />
                        </ProtectedRoute>
                    }
                />
      </Routes>
    </BrowserRouter>
  );
}

export default App;