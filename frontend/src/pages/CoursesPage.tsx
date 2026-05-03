import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {isValidUrl} from "../utils/isValidUrl.ts";

interface Course {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  is_complited: boolean;
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

    const normalizedCourseName = newCourseName.trim();

    const { data: existingCourse, error: duplicateCheckError } = await supabase
        .from('courses')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', normalizedCourseName)
        .maybeSingle();

    if (duplicateCheckError) {
      setErrorMessage('Ошибка проверки дубликата курса: ' + duplicateCheckError.message);
      setIsCreatingCourse(false);
      return;
    }

    if (existingCourse) {
      setErrorMessage('Курс с таким названием уже существует.');
      setIsCreatingCourse(false);
      return;
    }

    const { data: createdCourse, error: courseError } = await supabase
        .from('courses')
        .insert([
          {
            name: normalizedCourseName,
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
        setErrorMessage('Курс создан, но ссылка не сохранилась: ' + linkError.message);
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

  const toggleCourseCompletion = async (courseId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('courses')
      .update({ is_complited: !currentStatus })
      .eq('id', courseId);

    if (error) {
      setErrorMessage('Ошибка обновления курса: ' + error.message);
    } else {
      setCourses(courses.map(course =>
        course.id === courseId 
          ? { ...course, is_complited: !currentStatus } 
          : course
      ));
    }
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
            <div className="file-upload-wrapper">
              <label className="file-upload-button">
                <span className="icon">📎</span>
                {selectedFile ? 'Файл выбран' : 'Прикрепить файл'}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="file-upload-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                  }}
                  disabled={isCreatingCourse}
                />
              </label>
              {selectedFile && (
                <span className="file-selected-name" title={selectedFile.name}>
                  {selectedFile.name}
                </span>
              )}
            </div>

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
            <div key={course.id} className="course-card-wrapper" style={{ position: 'relative' }}>
              <Link 
                to={`/courses/${course.id}`} 
                className="course-card"
                style={{
                  opacity: course.is_complited ? 0.7 : 1,
                  background: course.is_complited ? 'var(--color-bg-secondary)' : 'var(--color-bg-card)',
                }}
              >
                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px' }}>
                      {course.name}
                    </h3>
                    {course.is_complited && (
                      <span style={{ color: '#4caf50', fontSize: '16px' }}>✅</span>
                    )}
                  </div>
                  <p
                    style={{
                      color: 'var(--color-text-muted)',
                      fontSize: '14px',
                      lineHeight: '1.5',
                    }}
                  >
                    {course.description?.trim() || 'Описание курса пока не добавлено.'}
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
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCourseCompletion(course.id, course.is_complited);
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  backgroundColor: course.is_complited ? 'rgba(76, 175, 80, 0.15)' : 'rgba(158, 158, 158, 0.1)',
                  color: course.is_complited ? '#4caf50' : 'var(--color-text-muted)',
                  transition: 'all 0.2s ease',
                }}
                title={course.is_complited ? 'Отметить как активный' : 'Завершить курс'}
              >
                {course.is_complited ? '✅' : '✔️'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}