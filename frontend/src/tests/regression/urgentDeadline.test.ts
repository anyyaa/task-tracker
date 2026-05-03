import { describe, expect, it } from 'vitest';
import {isUrgentDeadline} from "../../utils/deadlines.ts";

describe('urgent deadline regression', () => {
    it('marks only future deadlines within 24 hours as urgent', () => {
        const now = new Date('2026-05-10T12:00:00').getTime();

        expect(isUrgentDeadline('2026-05-10T18:00:00', now)).toBe(true);
        expect(isUrgentDeadline('2026-05-11T13:00:00', now)).toBe(false);
        expect(isUrgentDeadline('2026-05-10T10:00:00', now)).toBe(false);
        expect(isUrgentDeadline(null, now)).toBe(false);
    });
});