// ─── Core Entity Types ────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  matricule?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  classId?: string;
  isActive: number; // SQLite returns 0/1
  createdAt: string;
}

export interface Class {
  id: string;
  name: string;
  level: string;
  academicYear: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  coefficient: number;
  createdAt: string;
}

export type EvaluationType = 'devoir' | 'composition';

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  gradeValue: number;
  coefficient: number;
  evaluationType: EvaluationType;
  semester: number;
  academicYear: string;
  createdAt: string;
}

export type AttendanceType = 'absence' | 'retard' | 'punition' | 'colle';

export interface Attendance {
  id: string;
  studentId: string;
  teacherId: string;
  type: AttendanceType;
  description?: string;
  date: string;
  subjectId?: string;
  createdAt: string;
}

export interface TeacherClass {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  academicYear: string;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  matricule?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  classId?: string;
}

// ─── Hook Input Types ─────────────────────────────────────────────────────────

export interface CreateStudentInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  classId?: string;
}

export interface CreateTeacherInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface CreateClassInput {
  name: string;
  level: string;
  academicYear: string;
}

export interface CreateSubjectInput {
  name: string;
  coefficient?: number;
}

export interface CreateGradeInput {
  studentId: string;
  subjectId: string;
  teacherId: string;
  gradeValue: number;
  coefficient?: number;
  evaluationType: EvaluationType;
  semester?: number;
  academicYear: string;
}

export interface UpdateGradeInput {
  gradeValue?: number;
  coefficient?: number;
  evaluationType?: EvaluationType;
  semester?: number;
}

export interface CreateAttendanceInput {
  studentId: string;
  teacherId: string;
  type: AttendanceType;
  description?: string;
  date: string;
  subjectId?: string;
}
