import React, { useState } from 'react';
import { 
  GraduationCap, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink,
  Lock
} from 'lucide-react';
import { LmsCourse, CourseLesson, User } from '../../types';

interface LmsCourseViewProps {
  courses: LmsCourse[];
  currentUser: User;
  onCompleteCourse: (courseId: string) => void;
}

export const LmsCourseView: React.FC<LmsCourseViewProps> = ({
  courses,
  currentUser,
  onCompleteCourse,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<LmsCourse | null>(null);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});

  const handleOpenCourse = (course: LmsCourse) => {
    setSelectedCourse(course);
    setActiveLesson(course.lessons[0] || null);
  };

  const handleLessonFinish = (lessonId: string) => {
    const nextCompleted = { ...completedLessons, [lessonId]: true };
    setCompletedLessons(nextCompleted);

    if (selectedCourse) {
      const allDone = selectedCourse.lessons.every((l) => nextCompleted[l.id] || l.id === lessonId);
      if (allDone) {
        onCompleteCourse(selectedCourse.id);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-4 gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              LMS · КОРПОРАТИВНЫЙ УНИВЕРСИТЕТ И СЕРТИФИКАЦИЯ
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">
                Связь с ролями RBAC (Section 8.2)
              </span>
            </h2>
            <div className="text-xs text-neutral-400">
              Ваши завершенные курсы: {currentUser.completedCourses.length} из {courses.length}
            </div>
          </div>
        </div>

        {/* User Badges */}
        <div className="flex items-center gap-2">
          {currentUser.completedCourses.map((cId) => {
            const course = courses.find((c) => c.id === cId);
            return (
              <span
                key={cId}
                className="text-xs px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg flex items-center gap-1 font-mono"
              >
                <Award className="w-3.5 h-3.5" />
                {course?.badge || 'Сертификат'}
              </span>
            );
          })}
        </div>
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
        {courses.map((course) => {
          const isCompleted = currentUser.completedCourses.includes(course.id);

          return (
            <div
              key={course.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                isCompleted
                  ? 'bg-neutral-900/90 border-amber-500/50 shadow-md shadow-amber-950/20'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-amber-400">{course.badge}</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-neutral-950 text-neutral-400 rounded border border-neutral-800">
                    Уровень: {course.difficulty}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-2 leading-snug">{course.title}</h3>
                <p className="text-xs text-neutral-300 leading-relaxed mb-4">{course.description}</p>

                {/* RBAC Requirements */}
                <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800/80 mb-4 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-mono text-neutral-500 block">
                    Обязателен для назначения ролей:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {course.requiredForRoles.map((role) => (
                      <span
                        key={role}
                        className="text-[10px] font-mono px-2 py-0.5 bg-neutral-900 text-cyan-300 rounded border border-cyan-500/20"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-500 flex items-center gap-1 text-[11px]">
                  <BookOpen className="w-3.5 h-3.5" />
                  {course.lessons.length} уроков
                </span>

                {isCompleted ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-4 h-4" /> Пройдено
                  </span>
                ) : (
                  <button
                    onClick={() => handleOpenCourse(course)}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    Пройти обучение <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* LESSON READER MODAL */}
      {selectedCourse && activeLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                  {selectedCourse.title}
                </span>
                <h3 className="text-sm font-bold text-white">{activeLesson.title}</h3>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-neutral-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body with Sidebar Lessons */}
            <div className="flex flex-1 overflow-hidden">
              {/* Lessons List */}
              <div className="w-64 border-r border-neutral-800 bg-neutral-950/80 p-3 overflow-y-auto space-y-1.5 text-xs">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-2">
                  Программа курса:
                </span>
                {selectedCourse.lessons.map((lesson, idx) => {
                  const isDone = completedLessons[lesson.id];
                  const isCurrent = activeLesson.id === lesson.id;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className={`w-full text-left p-2 rounded-lg transition-colors flex items-center gap-2 ${
                        isCurrent
                          ? 'bg-neutral-800 text-white font-semibold'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-neutral-700 flex items-center justify-center text-[9px] font-mono shrink-0">
                          {idx + 1}
                        </span>
                      )}
                      <span className="truncate">{lesson.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Lesson Content Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs text-neutral-200 leading-relaxed">
                <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Продолжительность: {activeLesson.durationMinutes} мин</span>
                </div>

                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3 font-sans">
                  <h4 className="text-sm font-bold text-white">{activeLesson.title}</h4>
                  <p className="text-neutral-300 leading-relaxed">{activeLesson.content}</p>

                  <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 font-mono text-[11px] text-cyan-300">
                    // Проверка соответствия OWASP ASVS 5.0 (V4.1):<br />
                    SELECT * FROM information_schema.tables WHERE table_schema = current_setting('app.current_tenant');
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    onClick={() => handleLessonFinish(activeLesson.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Завершить урок и подтвердить компетенцию
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
