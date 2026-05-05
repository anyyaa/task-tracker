import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function FeedbackMetricsWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [nps, setNps] = useState(10);
    const [csat, setCsat] = useState(5);
    const [ces, setCes] = useState(5);
    const [comment, setComment] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitFeedback = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setMessage('');

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setMessage('Пользователь не авторизован');
                return;
            }

            const { error } = await supabase.from('feedback_metrics').insert([
                {
                    user_id: user.id,
                    nps_score: nps,
                    csat_score: csat,
                    ces_score: ces,
                    comment: comment.trim() || null,
                    page: window.location.pathname,
                },
            ]);

            if (error) {
                setMessage('Не удалось отправить отзыв. Попробуйте позже.');
                return;
            }

            setMessage('Отзыв отправлен. Спасибо!');
            setComment('');

            setTimeout(() => {
                setIsOpen(false);
                setMessage('');
            }, 2000);
        } catch (error) {
            console.error('Feedback submit failed:', error);
            setMessage('Не удалось отправить отзыв. Попробуйте позже.');
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="feedback-widget">
            {isOpen && (
                <div className="feedback-panel">
                    <h3>Оцените приложение</h3>

                    <label>Порекомендовали бы UniFlow другу? {nps}/10</label>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        value={nps}
                        onChange={(e) => setNps(Number(e.target.value))}
                    />

                    <label>Насколько вы довольны приложением? {csat}/5</label>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        value={csat}
                        onChange={(e) => setCsat(Number(e.target.value))}
                    />

                    <label>Насколько понятно/легко было пользоваться приложением? {ces}/5</label>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        value={ces}
                        onChange={(e) => setCes(Number(e.target.value))}
                    />

                    <textarea
                        placeholder="Комментарий"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />

                    <button className="btn-primary" onClick={submitFeedback}>
                        Отправить
                    </button>

                    {message && (
                        <div className="feedback-message">
                            {message}
                        </div>
                    )}
                </div>
            )}

            <button className="btn-primary" onClick={submitFeedback} disabled={isSubmitting}>
                {isSubmitting ? 'Отправка...' : 'Отправить'}
            </button>
        </div>
    );
}
