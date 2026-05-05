export function isUrgentDeadline(deadline: string | null, now = Date.now()) {
    if (!deadline) return false;

    const diff = new Date(deadline).getTime() - now;

    return diff > 0 && diff < 24 * 60 * 60 * 1000;
}