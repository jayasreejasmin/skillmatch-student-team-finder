# SkillMatch — Student Skill-Based Project Team Finder

> **A student skill-based project team formation platform, built and deployed using CI/CD and containerized infrastructure.**

---

## 📌 Problem Statement

Students in academic institutions frequently have innovative project ideas for hackathons, final-year capstones, or extracurricular research, but often lack all the technical skills required to build them. For instance, a student proficient in **Frontend Development (HTML/CSS/React)** may require collaborators skilled in **Backend APIs, Relational Databases, or Machine Learning**.

Currently, students rely on word-of-mouth or informal messaging groups, making it slow and difficult to discover peers with specific, complementary skill sets.

---

## 💡 Solution Overview

**SkillMatch** is a centralized web platform where students create a technical profile listing their validated skills, post project proposals detailing their required competencies, and instantly match with available peers. 

The platform simplifies team formation by replacing guesswork with automated skill matching.

---

## 🚀 MVP Features

To maintain reliability and clean DevOps delivery, the application scope is focused strictly on core collaboration needs:

* **Student Authentication:** Secure registration and login.
* **Student Profile & Skills:** Profile management with granular skill tags (e.g., `React`, `Node.js`, `Python`, `PostgreSQL`).
* **Project Posting:** Project creation with descriptions and required technical competencies.
* **Skill Matching:** Automated matching querying students possessing the skills required for a project.
* **Team Requests:** Send, accept, or reject team collaboration invitations.

> **Scope Note:** Features like real-time chat, video calling, AI-based resume parsing, and push notifications are intentionally excluded from the initial release to maintain a resilient, production-ready MVP.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | **React (Vite)** | Modular, responsive Single Page Application (SPA), fast container build times. |
| **Backend** | **Node.js (Express.js)** | Lightweight RESTful microservice architecture, non-blocking I/O. |
| **Database** | **PostgreSQL** | ACID-compliant relational data store with relational mapping for student-skill graphs. |
| **Containerization** | **Docker** | Multi-stage Dockerfiles for immutable frontend and backend images. |
| **Orchestration** | **Kubernetes** | Declarative deployments, replica sets, service discovery, and persistent volume management. |
| **CI/CD Pipeline** | **Jenkins** | Automated pipeline-as-code for build, automated testing, image publishing, and deployment. |

---

## 🔄 DevOps & CI/CD Pipeline Workflow

SkillMatch demonstrates industry-standard DevOps practices from code commit to zero-downtime containerized deployment:

```text
              GitHub (Source Code Management)
                         ↓  (Webhook trigger)
              Jenkins CI/CD Automation
                         ↓
             [Stage 1: Checkout Code]
                         ↓
             [Stage 2: Run Automated Unit Tests]
                         ↓
             [Stage 3: Build Docker Images (Multi-Stage)]
                         ↓
             [Stage 4: Push to Container Registry (Docker Hub)]
                         ↓
             [Stage 5: Deploy to Kubernetes Cluster]
                         ↓
             [Stage 6: Health Check & Rollout Verification]
                        ↙ ↘
        Frontend Pods (React)   Backend Pods (Express)
                                      ↓
                                PostgreSQL Pod (PVC)
```

### Pipeline Stages

1. **Source Code Management (GitHub):** Developers commit changes to feature branches; pull requests and main branch commits trigger Jenkins builds automatically.
2. **Automated Testing:** Jenkins runs automated unit and integration tests for backend APIs and frontend components before artifacts are built.
3. **Containerization (Docker):** Optimized multi-stage Docker builds package backend and frontend services into lean container images tagged with build numbers.
4. **Artifact Management (Docker Registry):** Tagged images are securely pushed to Docker Hub or an institutional container registry.
5. **Orchestration (Kubernetes):** Jenkins updates the cluster using Kubernetes manifests (`Deployments`, `Services`, `ConfigMaps`, `Secrets`, and `PersistentVolumeClaims`).
6. **Continuous Monitoring & Health Check:** Kubernetes performs rolling updates and validates liveness/readiness probes to ensure zero downtime.

---

## 📂 Project Structure

```text
skillmatch-student-team-finder/
├── backend/                  # Node.js Express REST API service
│   ├── src/                  # Source code (routes, controllers, models)
│   └── tests/                # Automated API unit tests
├── frontend/                 # React (Vite) Single Page Application
│   └── src/                  # UI components, pages, state management
├── database/                 # Database initialization and migration scripts
│   └── init.sql              # Database schema and seed data
├── deployments/              # Deployment and container orchestration configs
│   ├── docker/               # Dockerfiles and docker-compose configurations
│   └── k8s/                  # Kubernetes YAML manifests (Deployments, Services, PVC)
├── Jenkinsfile               # Declarative CI/CD pipeline definition
├── .gitignore                # Git ignore patterns for dependencies and secrets
└── README.md                 # Project documentation
```

---

## 🏃 Local Development Quickstart

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [Docker & Docker Compose](https://www.docker.com/)
* [Git](https://git-scm.com/)

### Running Locally with Docker Compose
```bash
# Clone the repository
git clone https://github.com/your-username/skillmatch-student-team-finder.git
cd skillmatch-student-team-finder

# Launch all services (Frontend, Backend, Database)
docker compose -f deployments/docker/docker-compose.yml up --build
```
The application will be accessible at:
* **Frontend:** `http://localhost:3000`
* **Backend API:** `http://localhost:5000/api`
* **PostgreSQL:** `localhost:5432`
