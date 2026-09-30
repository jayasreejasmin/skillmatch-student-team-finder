/**
 * SkillMatch Core Matching Service
 * Computes matching scores between a project's required skills and available students.
 */

function normalizeSkill(skill) {
  return (skill || '').trim().toLowerCase();
}

/**
 * Calculates skill overlap between required skills and a candidate's skills.
 * @param {string[]} requiredSkills - List of skills required by the project.
 * @param {object} candidate - Student object containing a `skills` array.
 * @returns {object|null} Match summary object or null if 0 matching skills.
 */
function calculateMatch(requiredSkills, candidate) {
  if (!requiredSkills || requiredSkills.length === 0) {
    return null;
  }

  const normalizedRequired = requiredSkills.map(normalizeSkill);
  const normalizedCandidateSkills = (candidate.skills || []).map(normalizeSkill);

  const matchedSkills = [];
  const missingSkills = [];

  for (let i = 0; i < requiredSkills.length; i++) {
    const rawReq = requiredSkills[i];
    const normReq = normalizedRequired[i];

    if (normalizedCandidateSkills.includes(normReq)) {
      matchedSkills.push(rawReq);
    } else {
      missingSkills.push(rawReq);
    }
  }

  // If candidate has none of the required skills, exclude them
  if (matchedSkills.length === 0) {
    return null;
  }

  const matchPercentage = Math.round((matchedSkills.length / requiredSkills.length) * 100);

  return {
    studentId: candidate.id,
    name: candidate.name,
    email: candidate.email,
    skills: candidate.skills,
    matchedSkills,
    missingSkills,
    matchPercentage
  };
}

/**
 * Finds and ranks candidates for a given project's required skills.
 * @param {string[]} requiredSkills - Array of required skill names.
 * @param {object[]} candidates - Array of student candidate objects.
 * @param {number|string} [excludeStudentId] - Optional student ID to exclude (e.g. project owner).
 * @returns {object[]} Ranked array of matched candidates.
 */
function findMatches(requiredSkills, candidates, excludeStudentId = null) {
  if (!requiredSkills || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
    return [];
  }

  const matches = [];

  for (const candidate of candidates) {
    if (excludeStudentId && String(candidate.id) === String(excludeStudentId)) {
      continue; // Skip the project owner
    }

    const matchResult = calculateMatch(requiredSkills, candidate);
    if (matchResult) {
      matches.push(matchResult);
    }
  }

  // Sort by match percentage descending, then by number of matched skills descending
  matches.sort((a, b) => {
    if (b.matchPercentage !== a.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    return b.matchedSkills.length - a.matchedSkills.length;
  });

  return matches;
}

module.exports = {
  normalizeSkill,
  calculateMatch,
  findMatches
};
