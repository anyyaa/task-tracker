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
        const checkSession = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                setHasSession(false);
                setLoading(false);
                return;
            }

            setHasSession(Boolean(data.session));
            setLoading(false);
        };

        checkSession();
    }, []);

    if (loading) {
        return <div>Проверка авторизации...</div>;
    }

    if (!hasSession) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}