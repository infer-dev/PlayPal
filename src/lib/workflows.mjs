/** Demo workflow rules. Production must enforce equivalent rules on the server. */
export function sessionCanStart({ sessionStatus, supervisorStatus, participantApprovals }) {
  return sessionStatus === 'Approved'
    && supervisorStatus === 'simulated_verified'
    && participantApprovals.length > 0
    && participantApprovals.every((approval) => approval === 'approved');
}

export function missionCanAward(missionId, awardedMissionIds) {
  return typeof missionId === 'string'
    && missionId.length > 0
    && !awardedMissionIds.includes(missionId);
}
