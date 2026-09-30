const express = require('express');
const router = express.Router();
const { students, projects, teamRequests } = require('../data/store');
const { findMatches } = require('../services/matcher');

// Health Check Endpoint (Essential for Kubernetes Readiness/Liveness Probes)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'SkillMatch Backend API',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 1. Authentication Endpoints
// ==========================================

router.post('/auth/register', (req, res) => {
  const { name, email, password, bio, skills } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const existing = students.find((s) => s.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'A student with this email already exists.' });
  }

  const newStudent = {
    id: students.length + 1,
    name,
    email,
    bio: bio || '',
    skills: Array.isArray(skills) ? skills : []
  };

  students.push(newStudent);
  res.status(201).json({ message: 'Registration successful', student: newStudent });
});

router.post('/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const student = students.find((s) => s.email.toLowerCase() === email.toLowerCase());
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  res.status(200).json({
    message: 'Login successful',
    token: `mock-jwt-token-for-${student.id}`,
    student
  });
});

// ==========================================
// 2. Student & Skill Profile Endpoints
// ==========================================

router.get('/students', (req, res) => {
  const { skill } = req.query;
  if (skill) {
    const querySkill = skill.toLowerCase();
    const filtered = students.filter((s) =>
      s.skills.some((sk) => sk.toLowerCase().includes(querySkill))
    );
    return res.status(200).json(filtered);
  }
  res.status(200).json(students);
});

router.get('/students/:id', (req, res) => {
  const student = students.find((s) => s.id === parseInt(req.params.id, 10));
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.status(200).json(student);
});

router.put('/students/:id/skills', (req, res) => {
  const student = students.find((s) => s.id === parseInt(req.params.id, 10));
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const { skills } = req.body;
  if (!Array.isArray(skills)) {
    return res.status(400).json({ error: 'Skills must be an array of strings.' });
  }

  student.skills = skills;
  res.status(200).json({ message: 'Skills updated successfully', student });
});

// ==========================================
// 3. Project Endpoints
// ==========================================

router.get('/projects', (req, res) => {
  res.status(200).json(projects);
});

router.post('/projects', (req, res) => {
  const { ownerId, title, description, requiredSkills } = req.body;

  if (!title || !description || !requiredSkills || !Array.isArray(requiredSkills)) {
    return res.status(400).json({
      error: 'title, description, and requiredSkills (array) are required.'
    });
  }

  const newProject = {
    id: projects.length + 1,
    ownerId: ownerId || 1,
    title,
    description,
    requiredSkills,
    status: 'OPEN',
    teamMembers: [ownerId || 1],
    createdAt: new Date().toISOString()
  };

  projects.push(newProject);
  res.status(201).json({ message: 'Project created successfully', project: newProject });
});

router.get('/projects/:id', (req, res) => {
  const project = projects.find((p) => p.id === parseInt(req.params.id, 10));
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.status(200).json(project);
});

// ==========================================
// 4. Skill-Based Matching Endpoint
// ==========================================

router.get('/projects/:id/matches', (req, res) => {
  const project = projects.find((p) => p.id === parseInt(req.params.id, 10));
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Find students matching the project's required skills (excluding the owner)
  const matches = findMatches(project.requiredSkills, students, project.ownerId);

  res.status(200).json({
    projectId: project.id,
    projectTitle: project.title,
    requiredSkills: project.requiredSkills,
    matchCount: matches.length,
    matches
  });
});

// ==========================================
// 5. Team Requests Endpoints
// ==========================================

router.get('/requests', (req, res) => {
  const { studentId, projectId } = req.query;
  let results = [...teamRequests];

  if (studentId) {
    const id = parseInt(studentId, 10);
    results = results.filter((r) => r.receiverId === id || r.senderId === id);
  }

  if (projectId) {
    const pId = parseInt(projectId, 10);
    results = results.filter((r) => r.projectId === pId);
  }

  res.status(200).json(results);
});

router.post('/requests', (req, res) => {
  const { projectId, senderId, receiverId } = req.body;

  if (!projectId || !senderId || !receiverId) {
    return res.status(400).json({ error: 'projectId, senderId, and receiverId are required.' });
  }

  const existingRequest = teamRequests.find(
    (r) => r.projectId === projectId && r.senderId === senderId && r.receiverId === receiverId
  );

  if (existingRequest) {
    return res.status(409).json({ error: 'A team request is already pending for this student.' });
  }

  const newRequest = {
    id: teamRequests.length + 1,
    projectId,
    senderId,
    receiverId,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  teamRequests.push(newRequest);
  res.status(201).json({ message: 'Team request sent successfully', request: newRequest });
});

router.put('/requests/:id', (req, res) => {
  const { status } = req.body;
  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Status must be either ACCEPTED or REJECTED.' });
  }

  const request = teamRequests.find((r) => r.id === parseInt(req.params.id, 10));
  if (!request) {
    return res.status(404).json({ error: 'Team request not found.' });
  }

  request.status = status;

  // If accepted, add receiver to the project's team members
  if (status === 'ACCEPTED') {
    const project = projects.find((p) => p.id === request.projectId);
    if (project && !project.teamMembers.includes(request.receiverId)) {
      project.teamMembers.push(request.receiverId);
    }
  }

  res.status(200).json({ message: `Team request ${status.toLowerCase()}`, request });
});

module.exports = router;
