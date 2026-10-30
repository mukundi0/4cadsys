import { api, signIn, signOut } from './supabase'

export type StudentRecord = {
  name: string
  firstName: string
  admission: string
  level: string
  stream: string
  curriculum: string
  term: string
}

export type Assignment = {
  id: string
  subject: string
  title: string
  teacher: string
  due: string | null
  method: 'online' | 'class'
  lateAllowed: boolean
  instructions: string
  submission: { status: string; answer: string; feedback: string; score: string | null; submittedAt: string } | null
}
export type StudentPortal = {
  student: StudentRecord
  assignments: Assignment[]
  lessons: { id: string; weekday: number; weekdayName: string; time: string; subject: string; teacher: string; room: string }[]
  announcements: { id: string; title: string; body: string; category: string; publishedAt: string }[]
  reports: { id: string; title: string; term: string; period: string; status: string; classTeacherComment: string; principalComment: string; subjects: { subject: string; mark: string | null; maximumMark: string; grade: string; teacherComment: string }[] }[]
  attendance: { summary: { daysRecorded: number; present: number; verifiedAbsence: number }; records: { date: string; status: string; verified: boolean; note: string }[] }
  fees: { summary: { totalCharges: string; verifiedPayments: string; balance: string }; statement: { date: string; description: string; charge: string; payment: string; status?: string; receipt?: string }[] }
}

export async function loadStudentProfile(): Promise<StudentRecord> {
  const data = await api<{ student: StudentRecord }>('/api/student/profile/')
  return data.student
}

export async function loadStudentAssignments(): Promise<Assignment[]> {
  const data = await api<{ assignments: Assignment[] }>('/api/student/assignments/')
  return data.assignments
}

export async function loadStudentPortal(): Promise<StudentPortal> {
  return api<StudentPortal>('/api/student/portal/')
}

export async function submitStudentAssignment(id: string, answer: string) {
  return api<{ submission: NonNullable<Assignment['submission']> }>(`/api/student/assignments/${id}/submit/`, 'POST', { answer })
}

export async function signInStudent(username: string, password: string): Promise<void> {
  await signIn(username, password)
}

export async function signOutStudent(): Promise<void> {
  await signOut()
}
