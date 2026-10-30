import type { Assignment, StudentPortal } from './studentApi'

type StudentHomeProps = {
  portal: StudentPortal
  onOpenAssignment: (assignment: Assignment) => void
  onOpenAttendance: () => void
  onOpenReports: () => void
}

const weekday = (date: Date) => date.getDay() === 0 ? 6 : date.getDay() - 1

export default function StudentHome({ portal, onOpenAssignment, onOpenAttendance, onOpenReports }: StudentHomeProps) {
  const now = new Date()
  const lessons = portal.lessons.filter(lesson => lesson.weekday === weekday(now)).sort((a, b) => a.time.localeCompare(b.time))
  const nextAssignment = [...portal.assignments]
    .filter(assignment => !assignment.submission)
    .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))[0]
    ?? portal.assignments[0]
  const latestNotice = portal.announcements[0]
  const latestReport = portal.reports[0]
  const dateLabel = new Intl.DateTimeFormat('en-KE', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)

  return <div className="student-home">
    <div className="home-main-grid">
      <section className="home-panel home-lessons" aria-labelledby="home-lessons-title">
        <div className="home-panel-heading">
          <div><p className="home-kicker">YOUR TIMETABLE</p><h2 id="home-lessons-title">Today’s lessons</h2></div>
          <span className="home-date">{dateLabel}</span>
        </div>
        {lessons.length ? <ol className="home-lesson-list">{lessons.map((lesson, index) => <li className="home-lesson" key={lesson.id}>
          <span className="home-lesson-number">{String(index + 1).padStart(2, '0')}</span>
          <div className="home-lesson-time">{lesson.time}</div>
          <div className="home-lesson-detail"><strong>{lesson.subject}</strong><span>{[lesson.teacher, lesson.room].filter(Boolean).join(' · ') || 'Class lesson'}</span></div>
        </li>)}</ol> : <div className="home-empty"><strong>No lessons scheduled today</strong><span>Your school timetable will appear here.</span></div>}
        <button className="home-text-link" type="button" onClick={() => { location.hash = '#timetable' }}>View weekly timetable <span aria-hidden="true">→</span></button>
      </section>

      <section className="home-panel home-assignment" aria-labelledby="home-assignment-title">
        <p className="home-kicker">LEARNING</p>
        <div className="home-assignment-heading"><h2 id="home-assignment-title">{nextAssignment?.submission ? 'Recent assignment' : 'Next assignment'}</h2><span className={nextAssignment?.submission ? 'home-status is-done' : 'home-status'}>{nextAssignment?.submission ? 'Submitted' : nextAssignment ? (nextAssignment.method === 'online' ? 'Online work' : 'In class') : 'All caught up'}</span></div>
        {nextAssignment ? <>
          <p className="home-assignment-subject">{nextAssignment.subject}</p>
          <h3>{nextAssignment.title}</h3>
          <p className="home-assignment-meta">{nextAssignment.due ? `Due ${new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short' }).format(new Date(nextAssignment.due))}` : 'No due date set'}{nextAssignment.teacher ? ` · ${nextAssignment.teacher}` : ''}</p>
          <button className="home-primary-link" type="button" onClick={() => onOpenAssignment(nextAssignment)}>{nextAssignment.submission ? 'View assignment' : 'Open assignment'} <span aria-hidden="true">→</span></button>
        </> : <div className="home-empty"><strong>Nothing due right now</strong><span>New work from your teachers will appear here.</span></div>}
      </section>
    </div>

    <div className="home-secondary-grid">
      <section className="home-summary-panel" aria-labelledby="home-attendance-title">
        <div><p className="home-kicker">THIS TERM</p><h2 id="home-attendance-title">Attendance</h2></div>
        {portal.attendance.summary.daysRecorded ? <p className="home-attendance-number"><strong>{portal.attendance.summary.present}</strong><span>of {portal.attendance.summary.daysRecorded} recorded days present</span></p> : <p className="home-secondary-copy">No attendance has been recorded yet.</p>}
        <button className="home-text-link" type="button" onClick={onOpenAttendance}>View attendance <span aria-hidden="true">→</span></button>
      </section>

      <section className="home-summary-panel home-notice-panel" aria-labelledby="home-notice-title">
        <div><p className="home-kicker">FROM THE SCHOOL</p><h2 id="home-notice-title">Latest notice</h2></div>
        {latestNotice ? <><h3>{latestNotice.title}</h3><p className="home-secondary-copy">{latestNotice.body}</p><time>{new Date(latestNotice.publishedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</time></> : <p className="home-secondary-copy">There are no new notices.</p>}
      </section>

      {latestReport && <section className="home-summary-panel home-report-panel" aria-labelledby="home-report-title">
        <div><p className="home-kicker">ACADEMIC PROGRESS</p><h2 id="home-report-title">Latest report</h2></div>
        <p className="home-report-title">{latestReport.title}</p><p className="home-secondary-copy">{latestReport.term} · {latestReport.status}</p>
        <button className="home-text-link" type="button" onClick={onOpenReports}>View report <span aria-hidden="true">→</span></button>
      </section>}
    </div>
  </div>
}
