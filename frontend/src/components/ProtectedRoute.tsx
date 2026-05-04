import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type ProtectedRouteProps = {
    children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const [loading, setLoading] = useState(true);
    const [hasSession, setHasSession] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const checkSession = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (error) {
                    console.error('Auth check error:', error.message);
                    setHasSession(false);
                    return;
                }

                setHasSession(Boolean(data.session));
            } catch (error) {
                if (!isMounted) return;

                console.error('Auth check failed:', error);
                setHasSession(false);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        checkSession();

        return () => {
            isMounted = false;
        };
    }, []);


    if (loading) {
        return <div>Проверка авторизации...</div>;
    }

    if (!hasSession) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}