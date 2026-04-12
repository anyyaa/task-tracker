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

    useEffect(() => {
        const loadUser = async () => {
            const { data, error } = await supabase.auth.getUser();

            if (error) {
                console.error('Ошибка получения пользователя:', error.message);
                return;
            }

            const firstName = data.user?.user_metadata?.first_name ?? '';
            const lastName = data.user?.user_metadata?.last_name ?? '';

            const name = `${firstName} ${lastName}`.trim();
            setFullName(name);
            console.log(name);
        };

        loadUser();
    }, []);
  // Если мы на странице авторизации, шапку не показываем
  if (location.pathname === '/') return null;

  return (
    <header style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)', padding: '15px 0' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--color-primary)', fontSize: '24px' }}>UniFlow</h1>
        <nav style={{ display: 'flex', gap: '20px' }}>
        {fullName && (
        <span style={{ color: 'var(--color-text-main)' }}>
            {fullName}
        </span>
        )}
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