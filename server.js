const fs = require('fs');
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data.json');

const normalizeSkills = (skills = []) =>
  [...new Set(
    (Array.isArray(skills) ? skills : String(skills).split(','))
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
  )];

const state = {
  users: [
    { id: 1, name: 'Aarav', skills: ['docker', 'jenkins', 'aws', 'linux'] },
    { id: 2, name: 'Meera', skills: ['react', 'node', 'mongodb', 'tailwind'] },
    { id: 3, name: 'Rohan', skills: ['kubernetes', 'terraform', 'python', 'ci/cd'] }
  ],
  projects: [
    {
      id: 1,
      title: 'Zero-Downtime CI/CD Release Engine',
      description: 'Automates multi-stage Docker builds and canary rollouts directly from GitHub webhooks. Ideal for developers wanting hands-on Jenkins and Kubernetes pipeline experience.',
      ownerId: 1,
      requiredSkills: ['docker', 'jenkins', 'kubernetes', 'node'],
      requests: [],
      team: [1],
      messages: [
        { id: 1, senderId: 1, senderName: 'Aarav', text: 'Welcome to the CI/CD team! Drop your GitHub handles here.', time: '10:00 AM' }
      ]
    },
    {
      id: 2,
      title: 'Campus Cloud Resource Tracker',
      description: 'Monitors student container workloads and visualizes CPU/memory quotas in real time. Built with a lightweight React dashboard and Node.js telemetry APIs.',
      ownerId: 2,
      requiredSkills: ['react', 'node', 'docker', 'mongodb'],
      requests: [],
      team: [2],
      messages: [
        { id: 1, senderId: 2, senderName: 'Meera', text: 'Hey team, let us finalize the telemetry schema today.', time: '11:15 AM' }
      ]
    },
    {
      id: 3,
      title: 'Auto-Scaling Microservices Mesh',
      description: 'Deploys fault-tolerant Python and Node microservices orchestrated via Kubernetes HPA. Includes automated health checks, Prometheus alerts, and rolling updates.',
      ownerId: 3,
      requiredSkills: ['kubernetes', 'python', 'docker', 'jenkins'],
      requests: [],
      team: [3],
      messages: []
    },
    {
      id: 4,
      title: 'Smart Hackathon Team Matcher',
      description: 'Ranks student builders by verified tech stacks and streamlines project onboarding. Features real-time notifications and integrated squad messaging.',
      ownerId: 2,
      requiredSkills: ['javascript', 'node', 'react', 'css'],
      requests: [],
      team: [2],
      messages: []
    }
  ],
  notifications: [],
  nextUserId: 4,
  nextProjectId: 5,
  nextNotifId: 1
};

if (fs.existsSync(DATA_FILE)) {
  try {
    Object.assign(state, JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
  } catch (err) {
    console.error('Could not read data.json, starting with default data.');
  }
}

function saveState() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function addNotification(userId, text) {
  if (!userId) return;
  state.notifications.unshift({
    id: state.nextNotifId++,
    userId: Number(userId),
    text,
    read: false,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/api/users', (req, res) => {
  const { name, skills } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const cleanName = name.trim();
  const existing = state.users.find(u => u.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    if (skills && String(skills).trim()) {
      existing.skills = normalizeSkills(skills);
    }
    saveState();
    return res.status(200).json(existing);
  }

  const user = {
    id: state.nextUserId++,
    name: cleanName,
    skills: normalizeSkills(skills)
  };
  state.users.push(user);
  saveState();
  res.status(201).json(user);
});

app.get('/api/users', (req, res) => {
  res.json(state.users);
});

app.put('/api/users/:id', (req, res) => {
  const user = state.users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (req.body.name && req.body.name.trim()) {
    user.name = req.body.name.trim();
  }
  if (req.body.skills !== undefined) {
    user.skills = normalizeSkills(req.body.skills);
  }
  saveState();
  res.json(user);
});

app.post('/api/projects', (req, res) => {
  const { title, description, ownerId, requiredSkills } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Project title is required' });
  }
  const owner = state.users.find(u => u.id === Number(ownerId));
  const project = {
    id: state.nextProjectId++,
    title: title.trim(),
    description: (description && description.trim()) ||
      'Collaborative engineering build focused on clean architecture and automated deployment. Looking for motivated teammates to ship features together.',
    ownerId: owner ? owner.id : null,
    requiredSkills: normalizeSkills(requiredSkills),
    requests: [],
    team: owner ? [owner.id] : [],
    messages: owner
      ? [{
          id: 1,
          senderId: owner.id,
          senderName: owner.name,
          text: `Project "${title.trim()}" created! Ready to collaborate.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]
      : []
  };
  state.projects.unshift(project);
  saveState();
  res.status(201).json(project);
});

app.get('/api/projects', (req, res) => {
  const enriched = state.projects.map(p => {
    const owner = state.users.find(u => u.id === p.ownerId);
    const teamMembers = p.team
      .map(id => state.users.find(u => u.id === id))
      .filter(Boolean);
    const pendingUsers = p.requests
      .map(id => state.users.find(u => u.id === id))
      .filter(Boolean);

    return {
      ...p,
      ownerName: owner ? owner.name : 'Project Lead',
      ownerSkills: owner ? owner.skills : [],
      teamMembers,
      pendingUsers
    };
  });
  res.json(enriched);
});

app.post('/api/projects/:id/requests', (req, res) => {
  const project = state.projects.find(p => p.id === Number(req.params.id));
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const userId = Number(req.body.userId);
  const user = state.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!project.requests.includes(userId) && !project.team.includes(userId)) {
    project.requests.push(userId);
    addNotification(
      project.ownerId,
      `${user.name} (${user.skills.join(', ')}) requested to join "${project.title}".`
    );
    saveState();
  }
  res.status(201).json(project);
});

app.post('/api/projects/:id/requests/:userId/accept', (req, res) => {
  const project = state.projects.find(p => p.id === Number(req.params.id));
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const userId = Number(req.params.userId);
  const applicant = state.users.find(u => u.id === userId);
  const owner = state.users.find(u => u.id === project.ownerId);

  project.requests = project.requests.filter(id => id !== userId);
  if (!project.team.includes(userId)) {
    project.team.push(userId);
  }

  if (applicant) {
    const leaderName = owner ? owner.name : 'The project leader';
    addNotification(
      applicant.id,
      `🎉 ${leaderName} accepted your request to join "${project.title}"! Group chat is now active.`
    );
    project.messages.push({
      id: project.messages.length + 1,
      senderId: 0,
      senderName: 'System',
      text: `${applicant.name} joined the team!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  saveState();
  res.json(project);
});

app.post('/api/projects/:id/requests/:userId/decline', (req, res) => {
  const project = state.projects.find(p => p.id === Number(req.params.id));
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const userId = Number(req.params.userId);
  project.requests = project.requests.filter(id => id !== userId);
  saveState();
  res.json(project);
});

app.get('/api/projects/:id/messages', (req, res) => {
  const project = state.projects.find(p => p.id === Number(req.params.id));
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project.messages);
});

app.post('/api/projects/:id/messages', (req, res) => {
  const project = state.projects.find(p => p.id === Number(req.params.id));
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { senderId, text } = req.body;
  const sender = state.users.find(u => u.id === Number(senderId));
  if (!sender || !text || !text.trim()) {
    return res.status(400).json({ error: 'Valid sender and message text required' });
  }

  const msg = {
    id: project.messages.length + 1,
    senderId: sender.id,
    senderName: sender.name,
    text: text.trim(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  project.messages.push(msg);
  saveState();
  res.status(201).json(msg);
});

app.get('/api/users/:id/notifications', (req, res) => {
  const userId = Number(req.params.id);
  const list = state.notifications.filter(n => n.userId === userId);
  res.json(list);
});

app.post('/api/users/:id/notifications/read', (req, res) => {
  const userId = Number(req.params.id);
  state.notifications.forEach(n => {
    if (n.userId === userId) n.read = true;
  });
  saveState();
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;