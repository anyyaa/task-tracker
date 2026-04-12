import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Course {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseLink, setNewCourseLink] = useState('');
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setErrorMessage('');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage('Пользователь не авторизован.');
        setCourses([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки курсов:', error);
        setErrorMessage('Не удалось загрузить курсы.');
        setCourses([]);
      } else {
        setCourses(data || []);
      }

      setLoading(false);
    };

    fetchCourses();
  }, []);

  const resetCreateForm = () => {
    setNewCourseName('');
    setNewCourseDescription('');
    setNewCourseLink('');
    setSelectedFile(null);
    setShowCreateForm(false);
    setErrorMessage('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isValidUrl = (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const createCourse = async () => {
    if (!newCourseName.trim()) {
      setErrorMessage('Введите название курса.');
      return;
    }

    if (newCourseLink.trim() && !isValidUrl(newCourseLink.trim())) {
      setErrorMessage('Введите корректную ссылку. Она должна начинаться с http:// или https://');
      return;
    }

    setErrorMessage('');
    setIsCreatingCourse(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage('Пользователь не авторизован.');
      setIsCreatingCourse(false);
      return;
    }

    const { data: createdCourse, error: courseError } = await supabase
      .from('courses')
      .insert([
        {
          name: newCourseName.trim(),
          description: newCourseDescription.trim() || null,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (courseError) {
      setErrorMessage('Ошибка создания курса: ' + courseError.message);
      setIsCreatingCourse(false);
      return;
    }

    if (!createdCourse) {
      setErrorMessage('Курс не был создан.');
      setIsCreatingCourse(false);
      return;
    }

    if (selectedFile) {
      const originalFileName = selectedFile.name;
      const safeFileName = originalFileName
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '_');

      const filePath = `courses/${createdCourse.id}/${Date.now()}_${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('file_attachments')
        .upload(filePath, selectedFile);

      if (uploadError) {
        setCourses((prevCourses) => [createdCourse, ...prevCourses]);
        setErrorMessage('Курс создан, но файл не загрузился: ' + uploadError.message);
        setNewCourseName('');
        setNewCourseDescription('');
        setNewCourseLink('');
        setSelectedFile(null);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        setShowCreateForm(false);
        setIsCreatingCourse(false);
        return;
      }

      const { error: attachmentError } = await supabase
        .from('course_attachments')
        .insert([
          {
            id: crypto.randomUUID(),
            course_id: createdCourse.id,
            name: selectedFile.name,
            url: filePath,
            is_external: false,
          },
        ]);

      if (attachmentError) {
        setCourses((prevCourses) => [createdCourse, ...prevCourses]);
        setErrorMessage(
          'Курс создан, файл загружен, но запись о вложении не сохранилась: ' +
            attachmentError.message
        );
        setNewCourseName('');
        setNewCourseDescription('');
        setNewCourseLink('');
        setSelectedFile(null);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        setShowCreateForm(false);
        setIsCreatingCourse(false);
        return;
      }
    }

    if (newCourseLink.trim()) {
      const cleanLink = newCourseLink.trim();

      const { error: linkError } = await supabase
        .from('course_attachments')
        .insert([
          {
            id: crypto.randomUUID(),
            course_id: createdCourse.id,
            name: cleanLink,
            url: cleanLink,
            is_external: true,
          },
        ]);

      if (linkError) {
        setCourses((prevCourses) => [createdCourse, ...prevCourses]);
        setErrorMessage(
          'Курс создан, но ссылка не сохранилась: ' + linkError.message
        );
        setNewCourseName('');
        setNewCourseDescription('');
        setNewCourseLink('');
        setSelectedFile(null);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        setShowCreateForm(false);
        setIsCreatingCourse(false);
        return;
      }
    }

    setCourses((prevCourses) => [createdCourse, ...prevCourses]);
    resetCreateForm();
    setIsCreatingCourse(false);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="page-header">
          <h2 className="page-title">Мои курсы</h2>
        </div>

        <p style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          Загрузка курсов...
        </p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-title">Мои курсы</h2>

        <button
          className="btn-primary"
          onClick={() => {
            if (showCreateForm) {
              resetCreateForm();
            } else {
              setShowCreateForm(true);
            }
          }}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          {showCreateForm ? 'Отмена' : '+ Новый курс'}
        </button>
      </div>

      {errorMessage && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(255, 80, 80, 0.12)',
            border: '1px solid rgba(255, 80, 80, 0.35)',
            color: '#ff6b6b',
          }}
        >
          {errorMessage}
        </div>
      )}

      {showCreateForm && (
        <div
          className="content-card"
          style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <h3 style={{ margin: 0 }}>Создать курс</h3>

          <input
            type="text"
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            placeholder="Название курса"
            disabled={isCreatingCourse}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
              opacity: isCreatingCourse ? 0.7 : 1,
            }}
          />

          <textarea
            value={newCourseDescription}
            onChange={(e) => setNewCourseDescription(e.target.value)}
            placeholder="Описание курса (необязательно)"
            disabled={isCreatingCourse}
            rows={3}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
              resize: 'vertical',
              opacity: isCreatingCourse ? 0.7 : 1,
            }}
          />

          <input
            type="text"
            value={newCourseLink}
            onChange={(e) => setNewCourseLink(e.target.value)}
            placeholder="Ссылка на материал курса (необязательно)"
            disabled={isCreatingCourse}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
              opacity: isCreatingCourse ? 0.7 : 1,
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setSelectedFile(file);
              }}
              disabled={isCreatingCourse}
            />

            {selectedFile && (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                Выбран файл: {selectedFile.name}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-primary"
              onClick={createCourse}
              disabled={isCreatingCourse}
              style={{
                opacity: isCreatingCourse ? 0.7 : 1,
                cursor: isCreatingCourse ? 'not-allowed' : 'pointer',
              }}
            >
              {isCreatingCourse ? 'Создание...' : 'Создать курс'}
            </button>

            <button
              className="btn-secondary"
              onClick={resetCreateForm}
              disabled={isCreatingCourse}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="courses-grid">
        {courses.length === 0 ? (
          <div
            className="content-card"
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              padding: '40px',
            }}
          >
            Курсов пока нет. Создайте первый курс.
          </div>
        ) : (
          courses.map((course) => (
            <Link key={course.id} to={`/courses/${course.id}`} className="course-card">
              <div style={{ flexGrow: 1 }}>
                <h3 style={{ marginBottom: '10px', fontSize: '20px' }}>
                  {course.name}
                </h3>

                <p
                  style={{
                    color: 'var(--color-text-muted)',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                >
                  {course.description?.trim()
                    ? course.description
                    : 'Описание курса пока не добавлено.'}
                </p>
              </div>

              <div
                style={{
                  marginTop: '20px',
                  fontSize: '13px',
                  color: 'var(--color-primary)',
                  fontWeight: '500',
                }}
              >
                Перейти к задачам &rarr;
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}