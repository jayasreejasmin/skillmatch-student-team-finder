const { calculateMatch, findMatches, normalizeSkill } = require('../src/services/matcher');

describe('SkillMatch Matching Service Unit Tests', () => {
  const sampleCandidates = [
    {
      id: 2,
      name: 'Bob Smith',
      email: 'bob@univ.edu',
      skills: ['Python', 'Machine Learning', 'FastAPI']
    },
    {
      id: 3,
      name: 'Charlie Davis',
      email: 'charlie@univ.edu',
      skills: ['Java', 'Spring Boot', 'MySQL']
    },
    {
      id: 4,
      name: 'Diana Prince',
      email: 'diana@univ.edu',
      skills: ['HTML', 'CSS', 'Figma']
    }
  ];

  test('normalizeSkill should trim and lowercase input', () => {
    expect(normalizeSkill('  Python  ')).toBe('python');
    expect(normalizeSkill('Machine Learning')).toBe('machine learning');
    expect(normalizeSkill('')).toBe('');
  });

  test('calculateMatch should return correct match percentage for partial match', () => {
    const requiredSkills = ['Python', 'Machine Learning', 'MySQL'];
    const result = calculateMatch(requiredSkills, sampleCandidates[0]); // Bob

    expect(result).not.toBeNull();
    expect(result.matchedSkills).toEqual(['Python', 'Machine Learning']);
    expect(result.missingSkills).toEqual(['MySQL']);
    expect(result.matchPercentage).toBe(67); // 2 out of 3 = ~67%
  });

  test('calculateMatch should return null when a student has 0 overlapping skills', () => {
    const requiredSkills = ['Python', 'Machine Learning'];
    const result = calculateMatch(requiredSkills, sampleCandidates[2]); // Diana

    expect(result).toBeNull();
  });

  test('findMatches should rank candidates by highest match percentage first', () => {
    const requiredSkills = ['Python', 'Machine Learning', 'MySQL'];
    // Exclude owner ID 1
    const matches = findMatches(requiredSkills, sampleCandidates, 1);

    expect(matches.length).toBe(2); // Bob (67%) and Charlie (33%), Diana (0%) excluded
    expect(matches[0].name).toBe('Bob Smith');
    expect(matches[0].matchPercentage).toBe(67);
    expect(matches[1].name).toBe('Charlie Davis');
    expect(matches[1].matchPercentage).toBe(33);
  });

  test('findMatches should be case-insensitive', () => {
    const requiredSkills = ['python', 'machine learning'];
    const matches = findMatches(requiredSkills, sampleCandidates);

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].name).toBe('Bob Smith');
    expect(matches[0].matchPercentage).toBe(100);
  });
});
