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
  maximumScore: string
  draft: { answer: string; attachmentName: string | null; updatedAt: string } | null
  submission: { id: string; status: string; answer: string; attachmentName: string | null; feedback: string; score: string | null; submittedAt: string } | null
}
export type StudentPortal = {
  student: StudentRecord
  assignments: Assignment[]
  lessons: { id: string; weekday: number; weekdayName: string; time: string; subject: string; teacher: string; room: string }[]
  announcements: { id: string; title: string; body: string; category: string; publishedAt: string }[]
  reports: { id: string; title: string; term: string; period: string; status: string; classTeacherComment: string; principalComment: string; subjects: { subject: string; mark: string | null; maximumMark: string; grade: string; teacherComment: string }[] }[]
  attendance: { summary: { daysRecorded: number; present: number; verifiedAbsence: number }; records: { id:string; date: string; status: string; verified: boolean; note: string }[] }
  fees: { summary: { totalCharges: string; verifiedPayments: string; balance: string }; invoices?: {id:string;number:string;term:string;balance:string;status:string}[]; statement: { date: string; description: string; charge: string; payment: string; status?: string; receipt?: string }[] }
  requests?: {id:string;category:string;status:string;message:string;staffResponse:string;createdAt:string}[]
}
export type LibraryBook = { id:string; title:string; author:string; subject:string; class_level:string; description:string; file_name:string; file_size:number; uploadedAt:string }
export type SavedLibraryBook = { id:string; workKey:string; editionKey:string; title:string; author:string; coverId:number|null; savedAt:string }
export async function loadLibraryBooks(){return (await api<{books:LibraryBook[]}>('/api/student/library/')).books}
export async function readLibraryBook(id:string){return api<{url:string}>(`/api/student/library/${id}/read/`)}
export async function loadSavedLibraryBooks(){return (await api<{books:SavedLibraryBook[]}>('/api/student/library/saved/')).books}
export async function saveCatalogBook(book:Omit<SavedLibraryBook,'id'|'savedAt'>){return api<{saved:boolean}>('/api/student/library/saved/','POST',{...book,action:'save'})}
export async function removeCatalogBook(workKey:string){return api<{saved:boolean}>('/api/student/library/saved/','POST',{workKey,action:'remove'})}

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

export async function saveStudentAssignment(id: string, answer: string, fileBase64?: string, fileName?: string) {
  return api(`/api/student/assignments/${id}/submit/`, 'POST', { action:'draft', answer, fileBase64, fileName })
}
export async function submitStudentAssignment(id: string, answer: string, fileBase64?: string, fileName?: string) {
  return api<{ submission: NonNullable<Assignment['submission']> }>(`/api/student/assignments/${id}/submit/`, 'POST', { action:'submit', answer, fileBase64, fileName })
}
export async function studentRequest(body: unknown) {
  return api('/api/student/requests/', 'POST', body)
}
export async function openStudentFile(kind: 'submission'|'draft'|'payment', id: string) {
  const path = kind==='submission' ? `/api/private/files/submission/${id}/` : kind==='draft'?`/api/private/files/draft/${id}/`:`/api/private/files/payment/${id}/`
  const data=await api<{url:string}>(path); window.open(data.url,'_blank','noopener,noreferrer')
}
export async function studentInvoicePayment(id:string,body:unknown,proof=false) {
  return api(`/api/student/invoices/${id}/${proof?'proof':'stk-push'}/`,'POST',body)
}

export async function signInStudent(username: string, password: string): Promise<void> {
  await signIn(username, password)
}

export async function signOutStudent(): Promise<void> {
  await signOut()
}
