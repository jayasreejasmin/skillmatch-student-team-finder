/**
 * SkillMatch In-Memory Data Store
 * Provides default state and helper operations for students, projects, and team requests.
 */

const students = [
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@univ.edu',
    bio: 'Frontend enthusiast focused on responsive Web UI and UX.',
    skills: ['HTML', 'CSS', 'JavaScript', 'React']
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@univ.edu',
    bio: 'AI researcher and Python backend developer.',
    skills: ['Python', 'Machine Learning', 'FastAPI']
  },
  {
    id: 3,
    name: 'Charlie Davis',
    email: 'charlie@univ.edu',
    bio: 'Backend systems engineer, relational databases and microservices.',
    skills: ['Java', 'Spring Boot', 'MySQL', 'Docker']
  },
  {
    id: 4,
    name: 'Diana Prince',
    email: 'diana@univ.edu',
    bio: 'Full-stack cloud developer specialized in Node and PostgreSQL.',
    skills: ['Node.js', 'PostgreSQL', 'Express.js', 'Docker']
  }
];

const projects = [
  {
    id: 1,
    ownerId: 1,
    title: 'AI College Attendance System',
    description: 'An automated computer vision & facial recognition attendance tracker for lecture halls.',
    requiredSkills: ['Python', 'Machine Learning', 'MySQL'],
    status: 'OPEN',
    teamMembers: [1],
    createdAt: new Date().toISOString()
  }
];

const teamRequests = [
  {
    id: 1,
    projectId: 1,
    senderId: 1,
    receiverId: 2,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  }
];

module.exports = {
  students,
  projects,
  teamRequests
};
