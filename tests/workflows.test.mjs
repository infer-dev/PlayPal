import test from 'node:test';
import assert from 'node:assert/strict';
import { missionCanAward, sessionCanStart } from '../src/lib/workflows.mjs';

test('a session cannot start while any parent approval is pending', () => {
  assert.equal(sessionCanStart({ sessionStatus: 'Approved', supervisorStatus: 'simulated_verified', participantApprovals: ['approved', 'pending'] }), false);
});

test('a session starts only after approvals and simulated supervisor authorization', () => {
  assert.equal(sessionCanStart({ sessionStatus: 'Approved', supervisorStatus: 'simulated_verified', participantApprovals: ['approved', 'approved'] }), true);
  assert.equal(sessionCanStart({ sessionStatus: 'Approved', supervisorStatus: 'unverified', participantApprovals: ['approved'] }), false);
  assert.equal(sessionCanStart({ sessionStatus: 'Draft', supervisorStatus: 'simulated_verified', participantApprovals: ['approved'] }), false);
});

test('mission rewards are issued once per mission', () => {
  assert.equal(missionCanAward('nature-detective', []), true);
  assert.equal(missionCanAward('nature-detective', ['nature-detective']), false);
  assert.equal(missionCanAward('', []), false);
});
