export function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function canReviewStudentRequest(role, classAssignments, studentStream) {
  if (role === 'principal' || role === 'admin') return true
  return Array.isArray(classAssignments) && classAssignments.some(
    assignment => !assignment.stream || assignment.stream === studentStream,
  )
}

export function corsOrigin(origin, allowlist) {
  return allowlist.includes(origin) ? origin : 'null'
}
