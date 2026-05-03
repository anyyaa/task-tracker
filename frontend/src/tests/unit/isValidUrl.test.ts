import { describe, expect, it } from 'vitest';
import { isValidUrl } from '../../utils/isValidUrl.ts';

describe('isValidUrl', () => {
    it('accepts valid urls and rejects invalid strings', () => {
        expect(isValidUrl('https://example.com/material')).toBe(true);
        expect(isValidUrl('http://example.com')).toBe(true);
        expect(isValidUrl('not-a-link')).toBe(false);
    });
});