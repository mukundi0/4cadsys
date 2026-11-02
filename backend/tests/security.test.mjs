import test from 'node:test'
import assert from 'node:assert/strict'
import { canReviewStudentRequest, corsOrigin, isUuid } from '../supabase/functions/school-api/security.mjs'

test('UUID validation accepts UUIDs and rejects malformed identifiers', () => {
  assert.equal(isUuid('7c9e6679-7425-40de-944b-e07fc1f90ae7'), true)
  assert.equal(isUuid('not-a-uuid'), false)
  assert.equal(isUuid('7c9e6679-7425-40de-944b-e07fc1f90ae'), false)
})

test('only the assigned class teacher or school leaders can review student requests', () => {
  assert.equal(canReviewStudentRequest('teacher', [], 'Blue'), false)
  assert.equal(canReviewStudentRequest('teacher', [{ stream: 'Red' }], 'Blue'), false)
  assert.equal(canReviewStudentRequest('teacher', [{ stream: 'Blue' }], 'Blue'), true)
  assert.equal(canReviewStudentRequest('teacher', [{ stream: '' }], 'Blue'), true)
  assert.equal(canReviewStudentRequest('principal', [], 'Blue'), true)
  assert.equal(canReviewStudentRequest('admin', [], 'Blue'), true)
})

test('CORS reflects only exact configured origins', () => {
  const origins = ['https://school.example.org', 'http://localhost:5173']
  assert.equal(corsOrigin('https://school.example.org', origins), 'https://school.example.org')
  assert.equal(corsOrigin('https://school.example.org.attacker.test', origins), 'null')
  assert.equal(corsOrigin('https://other.example.org', origins), 'null')
})
