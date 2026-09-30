const request = require('supertest');
process.env.NODE_ENV = 'test';
const app = require('../src/server');

describe('SkillMatch Backend API Integration Tests', () => {
  test('GET /api/health should return status UP', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('SkillMatch Backend API');
  });

  test('GET /api/projects should return project list', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/projects/:id/matches should return matched students', async () => {
    const res = await request(app).get('/api/projects/1/matches');
    expect(res.statusCode).toBe(200);
    expect(res.body.projectId).toBe(1);
    expect(Array.isArray(res.body.matches)).toBe(true);
    expect(res.body.matches.length).toBeGreaterThan(0);
    // Project 1 needs Python, Machine Learning, MySQL -> Bob Smith (Python + ML) should be top match
    expect(res.body.matches[0].name).toBe('Bob Smith');
  });

  test('POST /api/requests should successfully create a pending team request', async () => {
    const res = await request(app)
      .post('/api/requests')
      .send({
        projectId: 1,
        senderId: 1,
        receiverId: 3 // Charlie Davis
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.request.status).toBe('PENDING');
    expect(res.body.request.receiverId).toBe(3);
  });
});
