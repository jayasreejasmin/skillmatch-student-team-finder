import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

export default function App() {
  const [backendOnline, setBackendOnline] = useState(false);
  const [students, setStudents] = useState([]);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [newSkill, setNewSkill] = useState('');

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);

  // New Project Form
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectSkills, setProjectSkills] = useState('');

  // Team Requests
  const [requests, setRequests] = useState([]);

  // Check Backend Health
  useEffect(() => {
    checkHealth();
    fetchStudents();
    fetchProjects();
    fetchRequests();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) setBackendOnline(true);
      else setBackendOnline(false);
    } catch {
      setBackendOnline(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/students`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        if (data.length > 0 && !currentStudent) {
          setCurrentStudent(data[0]); // Default to Alice Johnson
        }
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    }
  };

  // Fetch Matches when selected project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    const fetchMatches = async () => {
      setMatchLoading(true);
      try {
        const res = await fetch(`${API_BASE}/projects/${selectedProjectId}/matches`);
        if (res.ok) {
          const data = await res.json();
          setMatches(data.matches || []);
        }
      } catch (err) {
        console.error('Error fetching matches:', err);
      } finally {
        setMatchLoading(false);
      }
    };
    fetchMatches();
  }, [selectedProjectId, projects]);

  // Handle Add Skill to Current Student
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim() || !currentStudent) return;

    const updatedSkills = [...new Set([...currentStudent.skills, newSkill.trim()])];
    try {
      const res = await fetch(`${API_BASE}/students/${currentStudent.id}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: updatedSkills })
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentStudent(updated.student);
        setStudents((prev) =>
          prev.map((s) => (s.id === updated.student.id ? updated.student : s))
        );
        setNewSkill('');
      }
    } catch (err) {
      alert('Failed to update skills');
    }
  };

  // Remove Skill
  const handleRemoveSkill = async (skillToRemove) => {
    if (!currentStudent) return;
    const updatedSkills = currentStudent.skills.filter((s) => s !== skillToRemove);
    try {
      const res = await fetch(`${API_BASE}/students/${currentStudent.id}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: updatedSkills })
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentStudent(updated.student);
        setStudents((prev) =>
          prev.map((s) => (s.id === updated.student.id ? updated.student : s))
        );
      }
    } catch (err) {
      alert('Failed to update skills');
    }
  };

  // Create New Project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectTitle || !projectDesc || !projectSkills) {
      alert('Please fill out all project fields.');
      return;
    }

    const skillsArray = projectSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: currentStudent ? currentStudent.id : 1,
          title: projectTitle,
          description: projectDesc,
          requiredSkills: skillsArray
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProjects((prev) => [...prev, data.project]);
        setSelectedProjectId(data.project.id);
        setProjectTitle('');
        setProjectDesc('');
        setProjectSkills('');
      }
    } catch (err) {
      alert('Failed to create project');
    }
  };

  // Send Team Request
  const handleSendRequest = async (candidateId) => {
    if (!selectedProjectId || !currentStudent) return;

    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          senderId: currentStudent.id,
          receiverId: candidateId
        })
      });

      if (res.ok) {
        alert('Team request sent successfully!');
        fetchRequests();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to send request');
      }
    } catch {
      alert('Network error sending request');
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div>
      {/* Top Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-group">
            <span className="logo-badge">SM</span>
            <div className="header-title">
              <h1>SkillMatch</h1>
              <p>Student Skill-Based Project Team Finder</p>
            </div>
          </div>
          <div className={`status-pill ${backendOnline ? 'status-online' : 'status-offline'}`}>
            <span className="status-dot"></span>
            {backendOnline ? 'Backend API: Connected (Port 5000)' : 'Backend API: Disconnected'}
          </div>
        </div>
      </header>

      <main className="container">
        {/* Active Student Switcher Bar */}
        <section className="user-bar">
          <div className="user-selector">
            <span>Logged in as:</span>
            <select
              className="select-input"
              value={currentStudent?.id || ''}
              onChange={(e) => {
                const s = students.find((st) => st.id === parseInt(e.target.value, 10));
                setCurrentStudent(s);
              }}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="badge badge-primary">MVP Version 1.0</span>
          </div>
        </section>

        {/* Dashboard 2-Column Grid */}
        <div className="dashboard-grid">
          {/* Left Column: Student Profile & Project Creator */}
          <div>
            {/* Student Profile Card */}
            <div className="card">
              <h2>👤 My Profile & Skills</h2>
              {currentStudent ? (
                <div>
                  <p><strong>{currentStudent.name}</strong></p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {currentStudent.email}
                  </p>
                  <p style={{ margin: '0.5rem 0', fontSize: '0.85rem' }}>
                    {currentStudent.bio}
                  </p>

                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>My Skills:</label>
                    <div className="skill-badges">
                      {currentStudent.skills.map((skill) => (
                        <span key={skill} className="badge badge-primary">
                          {skill}
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              marginLeft: '4px'
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Add skill (e.g. Docker, Python)"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary btn-sm">
                      + Add
                    </button>
                  </form>
                </div>
              ) : (
                <p>Loading profile...</p>
              )}
            </div>

            {/* Create Project Form */}
            <div className="card">
              <h2>💡 Post New Project</h2>
              <form onSubmit={handleCreateProject}>
                <div className="form-group">
                  <label>Project Title</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. IoT Smart Campus Monitor"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="textarea"
                    placeholder="Describe what your project aims to build..."
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Required Skills (comma separated)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Python, Docker, React"
                    value={projectSkills}
                    onChange={(e) => setProjectSkills(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Post Project
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Skill Matching Discovery & Team Requests */}
          <div>
            {/* Project Selector & Match Engine */}
            <div className="card">
              <h2>🔍 Discover Matching Teammates</h2>
              
              <div className="form-group">
                <label>Select Project to Find Teammates For:</label>
                <select
                  className="select-input"
                  style={{ width: '100%' }}
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(parseInt(e.target.value, 10))}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (Owner: {students.find((s) => s.id === p.ownerId)?.name || 'Unknown'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProject && (
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{selectedProject.description}</p>
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Required Skills: </span>
                    {selectedProject.requiredSkills.map((sk) => (
                      <span key={sk} className="badge badge-primary" style={{ marginRight: '4px' }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Students List */}
              <h3 style={{ fontSize: '1rem', margin: '1rem 0 0.5rem' }}>
                Matching Students ({matches.length})
              </h3>

              {matchLoading ? (
                <p>Finding matching candidates...</p>
              ) : matches.length === 0 ? (
                <div className="empty-state">
                  No matching students found with the required skills. Try updating the project requirements or adding skills to students.
                </div>
              ) : (
                matches.map((match) => (
                  <div key={match.studentId} className="match-card">
                    <div className="match-card-header">
                      <div>
                        <div className="match-name">{match.name}</div>
                        <div className="match-email">{match.email}</div>
                      </div>
                      <span className="badge badge-score">
                        {match.matchPercentage}% Match
                      </span>
                    </div>

                    <div className="match-details">
                      <div>
                        <strong style={{ fontSize: '0.8rem', color: '#065f46' }}>Matched Skills: </strong>
                        {match.matchedSkills.map((sk) => (
                          <span key={sk} className="badge badge-match" style={{ marginRight: '4px' }}>
                            ✓ {sk}
                          </span>
                        ))}
                      </div>

                      {match.missingSkills.length > 0 && (
                        <div style={{ marginTop: '4px' }}>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Missing: </strong>
                          {match.missingSkills.map((sk) => (
                            <span key={sk} className="badge badge-missing" style={{ marginRight: '4px' }}>
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="match-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSendRequest(match.studentId)}
                      >
                        Send Team Request
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Team Requests Panel */}
            <div className="card">
              <h2>🤝 Collaboration Requests ({requests.length})</h2>
              {requests.length === 0 ? (
                <div className="empty-state">No team requests sent or received yet.</div>
              ) : (
                requests.map((req) => {
                  const project = projects.find((p) => p.id === req.projectId);
                  const sender = students.find((s) => s.id === req.senderId);
                  const receiver = students.find((s) => s.id === req.receiverId);

                  return (
                    <div
                      key={req.id}
                      style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                          Project: {project?.title || 'Unknown Project'}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          From: {sender?.name} ➔ To: {receiver?.name}
                        </p>
                      </div>
                      <span
                        className={`badge ${
                          req.status === 'ACCEPTED'
                            ? 'badge-match'
                            : req.status === 'REJECTED'
                            ? 'badge-missing'
                            : 'badge-score'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
