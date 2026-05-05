import { describe, expect, it } from 'vitest';
import {supabase} from "../../lib/supabase.ts";

describe('Supabase task list performance', () => {
    it('loads 1000 tasks from test course fast enough', async () => {
        const email = import.meta.env.VITE_TEST_USER_EMAIL;
        const password = import.meta.env.VITE_TEST_USER_PASSWORD;
        const courseId = import.meta.env.VITE_TEST_COURSE_ID;

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        expect(signInError).toBeNull();

        const startedAt = performance.now();

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('course_id', courseId)
            .order('deadline', { ascending: true, nullsFirst: false });

        const duration = performance.now() - startedAt;

        expect(error).toBeNull();
        expect(data).toHaveLength(1000);
        expect(duration).toBeLessThan(5000);
    });
},20000);