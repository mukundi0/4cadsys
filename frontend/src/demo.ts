// Development-only sample data so every portal can be previewed without a Supabase project:
//   npm run dev, then open /?demo=student, /?demo=parent or /?demo=staff
// supabase.ts only loads this when import.meta.env.DEV is true, so it is not part of the production bundle.
export const demoRole = () => new URLSearchParams(location.search).get('demo')

const L = (id: string, weekday: number, time: string, subject: string, teacher: string, room = '') => ({ id, weekday, weekdayName: '', time, subject, teacher, room })
const TIMES = ['08:00', '08:40', '09:20', '10:20', '11:00', '11:40']
const WEEK = [['Mathematics', 'English', 'Biology', 'Chemistry', 'Kiswahili', 'History'], ['English', 'Mathematics', 'Physics', 'History', 'Geography', 'CRE'], ['Kiswahili', 'Chemistry', 'Mathematics', 'English', 'Biology', 'Business'], ['Mathematics', 'English', 'Biology', 'Kiswahili', 'Physics', 'History'], ['Geography', 'Mathematics', 'English', 'Chemistry', 'Kiswahili', 'PE']]
const TEACH: Record<string, string> = { Mathematics: 'Mr. Otieno', English: 'Ms. Achieng', Biology: 'Mrs. Kamau', Chemistry: 'Mrs. Njeri', Kiswahili: 'Mr. Mutua', Physics: 'Mr. Omondi', History: 'Mr. Kiprop', Geography: 'Ms. Wairimu', CRE: 'Mrs. Chebet', Business: 'Mr. Ndegwa', PE: 'Mr. Kiprop' }
const lessons = WEEK.flatMap((day, d) => day.map((s, i) => L(`l${d}${i}`, d, TIMES[i], s, TEACH[s], /Bio/.test(s) ? 'Lab 1' : /Chem|Phys/.test(s) ? 'Lab 2' : 'Room 4')))
const statement = [
  { date: '2026-09-01', description: 'Term 3 tuition', charge: '45000', payment: '0' },
  { date: '2026-09-01', description: 'Boarding and meals', charge: '7400', payment: '0' },
  { date: '2026-09-04', description: 'mpesa · SLK4F2P9QA', charge: '0', payment: '40000', status: 'verified', receipt: 'RCT-260904-1a2b3c4d' },
  { date: '2026-10-28', description: 'mpesa · SLR8D1T7ZB', charge: '0', payment: '5000', status: 'pending' },
]
const student = { name: 'Amani Wanjiru', firstName: 'Amani', admission: '2026/0418', level: 'Form 2', stream: 'East', curriculum: '8-4-4', term: 'Term 3, 2026' }
const studentPortal = {
  student, lessons,
  assignments: [
    { id: 'a1', subject: 'Chemistry', title: 'Rates of reaction worksheet', teacher: 'Mrs. Njeri', due: '2026-11-03T08:00:00', method: 'online', lateAllowed: false, instructions: 'Answer questions 1 to 8 from the worksheet shared in class. Show all working for the calculations in questions 5 to 8.', submission: null },
    { id: 'a2', subject: 'Mathematics', title: 'Exercise 7.3: Quadratic equations', teacher: 'Mr. Otieno', due: '2026-10-31T08:00:00', method: 'class', lateAllowed: false, instructions: 'Complete questions 1 to 12 in your exercise book.', submission: null },
    { id: 'a3', subject: 'History', title: 'Early trade routes in East Africa', teacher: 'Mr. Kiprop', due: '2026-10-24T08:00:00', method: 'online', lateAllowed: false, instructions: 'Describe two long-distance trade routes.', submission: { status: 'submitted', answer: 'Traders moved salt, iron and ivory between the coast and the interior using caravan routes...', feedback: 'Good use of sources. Add a map next time.', score: '17 / 20', submittedAt: '2026-10-23' } },
  ],
  announcements: [{ id: 'n1', title: 'Half-term break', body: 'School closes Friday 7 November at 12:30.', category: 'General', publishedAt: '2026-10-28' }],
  reports: [{ id: 'r1', title: 'Midterm', term: 'Term 3, 2026', period: 'Midterm', status: 'approved', classTeacherComment: 'A steady term. Keep reading widely.', principalComment: '', subjects: [{ subject: 'Mathematics', mark: '78', maximumMark: '100', grade: 'A-', teacherComment: 'Strong algebra.' }, { subject: 'English', mark: '71', maximumMark: '100', grade: 'B+', teacherComment: 'Improve essay structure.' }, { subject: 'Physics', mark: null, maximumMark: '100', grade: '', teacherComment: '' }] }],
  attendance: { summary: { daysRecorded: 43, present: 41, verifiedAbsence: 1 }, records: [{ date: '2026-10-29', status: 'present', verified: false, note: '' }, { date: '2026-10-28', status: 'absent', verified: true, note: 'Clinic visit' }] },
  fees: { summary: { totalCharges: '52400', verifiedPayments: '40000', balance: '12400' }, statement },
}
const children = [{ id: 'c1', name: 'Amani Wanjiru', admissionNumber: '2026/0418', class: 'Form 2', stream: 'East', canViewFinances: true, canViewReports: true }, { id: 'c2', name: 'Baraka Wanjiru', admissionNumber: '2027/0102', class: 'Form 1', stream: 'West', canViewFinances: true, canViewReports: true }]
const parentChild = {
  student: { name: 'Amani Wanjiru', admissionNumber: '2026/0418', class: 'Form 2', term: 'Term 3, 2026' },
  assignments: studentPortal.assignments.map(a => ({ id: a.id, title: a.title, subject: a.subject, due: a.due })),
  timetable: [],
  reports: [{ id: 'r1', title: 'Midterm', term: 'Term 3, 2026', status: 'published' }],
  fees: { balance: '12400', statement, invoices: [{ id: 'i1', number: 'INV-1042', term: 'Term 3, 2026', status: 'issued', dueOn: '2026-11-15', total: '52400' }] },
}
const names = ['Amani Wanjiru', 'Brian Ochieng', 'Cynthia Akinyi', 'David Kariuki', 'Esther Naliaka', 'Felix Mutua', 'Gloria Chebet', 'Hassan Ali']
const reg = (cls: string, stream: string, n = 8) => names.slice(0, n).map((name, i) => ({ studentId: `${cls}${stream}${i}`, name, admissionNumber: `2026/0${418 + i * 3}`, class: cls, stream, status: stream === 'East' ? null : 'present', verified: false, note: '' }))
const scores = [{ subject: 'Mathematics', mark: '34', maximum: '40', comment: 'Confident with fractions.' }, { subject: 'English', mark: '28', maximum: '40', comment: 'Good vocabulary.' }, { subject: 'Sciences', mark: '31', maximum: '40', comment: '' }]
const applicants = [
  { id: 'p1', reference: 'APP-2026-031', name: 'Naomi Chebet', firstName: 'Naomi', lastName: 'Chebet', class: 'Form 1', curriculum: '8-4-4', term: 'Term 1, 2027', status: 'Interviewed', statusCode: 'interviewed', guardian: 'Esther Chebet', guardianPhone: '0722 418 903', guardianEmail: '', previousSchool: 'Kileleshwa Primary', previousGrades: '', observation: '', createdAt: '2026-10-01', decision: '', scores, documents: [{ id: 'd1', type: 'Birth certificate', verified: true }, { id: 'd2', type: 'Report card', verified: false }] },
  { id: 'p2', reference: 'APP-2026-032', name: 'Peter Mwangi', firstName: 'Peter', lastName: 'Mwangi', class: 'Form 2', curriculum: '8-4-4', term: 'Term 1, 2027', status: 'Awaiting interview', statusCode: 'applied', guardian: 'John Mwangi', guardianPhone: '0733 100 200', guardianEmail: '', previousSchool: 'Hillcrest', previousGrades: '', observation: '', createdAt: '2026-10-03', decision: '', scores: [], documents: [] },
]
const payments = [
  { id: 'y1', student: 'Amani Wanjiru', reference: 'SLR8D1T7ZB', date: '2026-10-28', amount: '5000', method: 'mpesa', status: 'pending', receipt: '', note: '', invoice: 'INV-1042' },
  { id: 'y2', student: 'Naomi Chebet', reference: 'SLR8D1T7ZB', date: '2026-10-29', amount: '5000', method: 'mpesa', status: 'pending', receipt: '', note: '', invoice: '' },
  { id: 'y3', student: 'Baraka Wanjiru', reference: 'SLK4F2P9QA', date: '2026-09-04', amount: '40000', method: 'bank', status: 'verified', receipt: 'RCT-260904-1a2b3c4d', note: '', invoice: 'INV-1043' },
]
const enrolments = [
  { id: 'e1', applicantId: 'p1', reference: 'APP-2026-031', name: 'Naomi Chebet', class: 'Form 1', curriculum: '8-4-4', term: 'Term 1, 2027', principalApproved: true, reported: true, paymentVerified: true, complete: true, studentCreated: false, payment: null },
  { id: 'e2', applicantId: 'p2', reference: 'APP-2026-032', name: 'Peter Mwangi', class: 'Form 2', curriculum: '8-4-4', term: 'Term 1, 2027', principalApproved: true, reported: false, paymentVerified: false, complete: false, studentCreated: false, payment: null },
]
const les = (id: string, d: number, s: string, e: string, subject: string, teacher: string, room: string, stream = 'East') => ({ id, class: 'Form 2', stream, term: 'Term 3, 2026', weekday: d, start: s, end: e, subject, teacher, room })
const ttLessons = WEEK.flatMap((day, d) => day.slice(0, 5).map((s, i) => les(`t${d}${i}`, d, TIMES[i], TIMES[i + 1] ?? '12:20', s, TEACH[s], 'Room 4')))
const sessions = [{ id: 's1', title: 'Midterm', term: 'Term 3, 2026', period: 'Midterm', class: 'Form 2', stream: 'East', published: false, reports: names.slice(0, 3).map((name, i) => ({ id: `rp${i}`, name, status: 'review', subjects: [{ subject: 'Mathematics', mark: '70' }, { subject: 'English', mark: i ? '65' : null }] })) }]

// Sample library items exist only in the local ?demo= previews. They are never
// written to Supabase or included in production builds.
const demoBooks = [
  { id: 'd0000000-0000-4000-8000-000000000001', title: 'The River and the Source', author: 'Margaret A. Ogola', subject: 'English', class_level: 'Form 2', description: 'A sample class reading resource for the library preview.', file_name: 'river-and-the-source-sample.pdf', file_size: 245760, is_published: true, uploadedAt: '2026-10-28' },
  { id: 'd0000000-0000-4000-8000-000000000002', title: 'Introduction to Biology', author: 'Demo Department', subject: 'Biology', class_level: 'Form 2', description: 'Sample biology notes for demonstrating the school library.', file_name: 'biology-introduction-sample.pdf', file_size: 524288, is_published: true, uploadedAt: '2026-10-29' },
  { id: 'd0000000-0000-4000-8000-000000000003', title: 'East African History', author: 'Demo Department', subject: 'History', class_level: '', description: 'A draft sample resource visible to staff only.', file_name: 'east-african-history-sample.pdf', file_size: 393216, is_published: false, uploadedAt: '2026-10-30' },
]
const demoSavedBooks: {id:string;workKey:string;editionKey:string;title:string;author:string;coverId:number|null;savedAt:string}[] = []
const demoReader = (title: string) => `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><meta name="viewport" content="width=device-width"><body style="font:16px/1.6 system-ui;max-width:720px;margin:10vh auto;padding:24px;color:#24352e"><h1>${title}</h1><p>This is a sample reading preview for the demo portal. In a connected school account, this viewer opens the PDF uploaded by staff.</p><h2>Reading note</h2><p>Use the school library to find class resources, read widely, and return to your lessons with questions to discuss.</p><p style="color:#68756e">Demo content · No book file is stored or served.</p></body>`)}`

const nope = (m: string): never => { throw Object.assign(new Error(m), { status: 403 }) }
export async function demoApi(path: string, method = 'GET', body?: unknown): Promise<unknown> {
  const role = demoRole(), url = new URL(path, 'http://x'), p = url.pathname
  if (p === '/api/school/profile/') return { school: { name: 'Demo School' } }
  if (p === '/api/staff/session/') return role === 'staff' ? { user: { name: 'Grace Mwangi' } } : nope('Your account does not have staff access.')
  if (p === '/api/parent/children/') return role === 'parent' ? { children } : nope('not guardian')
  if (p === '/api/student/portal/') return role === 'student' ? studentPortal : nope('not student')
  if (p === '/api/parent/notifications/') return { notifications: [{ id: 'n1', student: 'Amani', title: 'Half-term break', body: 'School closes Friday 7 November at 12:30.', createdAt: '2026-10-28', read: false }] }
  if (/^\/api\/parent\/children\/[^/]+\/portal\/$/.test(p)) return parentChild
  if (p === '/api/staff/dashboard/') return { students: 412, applications: 5, pendingPayments: 2, outstanding: '1284000', attendanceToday: { present: 389, absent: 14 } }
  if (p === '/api/staff/admissions/') return { applicants }
  if (p === '/api/staff/finance/') return { payments }
  if (p === '/api/staff/enrolments/') return { enrolments }
  if (p === '/api/staff/library/' && method === 'POST' && role === 'staff') {
    const item = body as { title?: string; author?: string; subject?: string; classLevel?: string; description?: string; fileName?: string; fileBase64?: string; publish?: boolean }
    const book = { id: `d0000000-0000-4000-8000-${String(demoBooks.length + 1).padStart(12, '0')}`, title: item.title || 'Demo upload', author: item.author || '', subject: item.subject || '', class_level: item.classLevel || '', description: item.description || 'Demo upload preview. No file is stored.', file_name: item.fileName || 'sample.pdf', file_size: item.fileBase64?.length || 0, is_published: item.publish === true, uploadedAt: new Date().toISOString().slice(0, 10) }
    demoBooks.unshift(book)
    return { id: book.id }
  }
  if (p === '/api/staff/library/') return { books: demoBooks }
  if (p === '/api/student/library/') return { books: demoBooks.filter(book => book.is_published && (!book.class_level || book.class_level === student.level)) }
  if (p === '/api/student/library/saved/' && role === 'student' && method === 'GET') return { books: demoSavedBooks }
  if (p === '/api/student/library/saved/' && role === 'student' && method === 'POST') {
    const item = body as { action?: string; workKey?: string; editionKey?: string; title?: string; author?: string; coverId?: number|null }
    const index = demoSavedBooks.findIndex(book => book.workKey === item.workKey)
    if (item.action === 'remove') { if (index >= 0) demoSavedBooks.splice(index, 1); return { saved: false } }
    if (index >= 0) demoSavedBooks.splice(index, 1)
    demoSavedBooks.unshift({ id: `demo-${item.workKey}`, workKey: item.workKey||'', editionKey: item.editionKey||'', title: item.title||'', author: item.author||'', coverId: item.coverId||null, savedAt: new Date().toISOString() })
    return { saved: true }
  }
  const readBook = p.match(/^\/api\/student\/library\/([^/]+)\/read\/$/)
  if (readBook) { const book = demoBooks.find(item => item.id === readBook[1] && item.is_published); return book ? { url: demoReader(book.title) } : nope('Book not found.') }
  const publishBook = p.match(/^\/api\/staff\/library\/([^/]+)\/publish\/$/)
  if (publishBook && role === 'staff') { const book = demoBooks.find(item => item.id === publishBook[1]); if (book) book.is_published = !book.is_published; return { published: book?.is_published ?? false } }
  if (p === '/api/staff/attendance/') return { date: '', term: '', students: [...reg('Form 2', 'East'), ...reg('Form 2', 'West'), ...reg('Form 3', 'East')] }
  if (p === '/api/staff/reports/') return { sessions }
  if (p === '/api/staff/timetable/') return { approved: false, lessons: ttLessons }
  return {}
}
