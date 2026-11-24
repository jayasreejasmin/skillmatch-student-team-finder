const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const app = require('../server');
const DATA_FILE = path.join(__dirname, '..', 'data.json');

function request(port, method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        method,
        headers: {
          ...(payload
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
              }
            : {})
        }
      },
      res => {
        let raw = '';
        res.on('data', chunk => { raw += chunk; });
        res.on('end', () => {
          let parsed = null;
          try { parsed = JSON.parse(raw); } catch { parsed = raw; }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe('SkillMatch Backend API Tests', () => {
  let server;
  let port;
  let hadDataFile = false;
  let originalData = null;

  before(async () => {
    hadDataFile = fs.existsSync(DATA_FILE);
    if (hadDataFile) {
      originalData = fs.readFileSync(DATA_FILE, 'utf8');
    }
    await new Promise(resolve => {
      server = app.listen(0, '127.0.0.1', () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise(resolve => server.close(resolve));
    if (hadDataFile && originalData !== null) {
      fs.writeFileSync(DATA_FILE, originalData);
    } else if (!hadDataFile && fs.existsSync(DATA_FILE)) {
      fs.unlinkSync(DATA_FILE);
    }
  });

  it('returns 200 ok on /health', async () => {
    const res = await request(port, 'GET', '/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
  });

  it('creates a user with normalized skills and updates skills', async () => {
    const created = await request(port, 'POST', '/api/users', {
      name: 'Jayshree',
      skills: 'Node, Docker, node'
    });
    assert.ok(created.status === 200 || created.status === 201);
    assert.equal(created.body.name, 'Jayshree');
    assert.deepEqual(created.body.skills, ['node', 'docker']);

    const updated = await request(port, 'PUT', `/api/users/${created.body.id}`, {
      skills: 'node, docker, jenkins'
    });
    assert.equal(updated.status, 200);
    assert.deepEqual(updated.body.skills, ['node', 'docker', 'jenkins']);
  });

  it('handles project creation, join request, leader accept, and group chat', async () => {
    const leader = await request(port, 'POST', '/api/users', {
      name: 'Pranathi',
      skills: 'docker, jenkins, kubernetes'
    });
    const member = await request(port, 'POST', '/api/users', {
      name: 'Jayshree',
      skills: 'node, docker'
    });

    const proj = await request(port, 'POST', '/api/projects', {
      title: 'Pipeline Automation Hub',
      description: 'Automates builds and deployments. Looking for team members.',
      ownerId: leader.body.id,
      requiredSkills: 'node, docker'
    });
    assert.equal(proj.status, 201);

    const reqSent = await request(port, 'POST', `/api/projects/${proj.body.id}/requests`, {
      userId: member.body.id
    });
    assert.equal(reqSent.status, 201);
    assert.ok(reqSent.body.requests.includes(member.body.id));

    const accepted = await request(
      port,
      'POST',
      `/api/projects/${proj.body.id}/requests/${member.body.id}/accept`
    );
    assert.equal(accepted.status, 200);
    assert.ok(accepted.body.team.includes(member.body.id));

    const msg = await request(port, 'POST', `/api/projects/${proj.body.id}/messages`, {
      senderId: member.body.id,
      text: 'Ready to test the pipeline!'
    });
    assert.equal(msg.status, 201);
    assert.equal(msg.body.text, 'Ready to test the pipeline!');
  });
});