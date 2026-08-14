# FICAS – Forensic Investigation Case Administration System

A monolithic case management system designed to **reduce paperwork for lawyers and forensic administrators** by digitising case processing and investigation workflows.

## Features

* Digital case management and processing
* Forensic administration and preliminary investigation workflows
* RBAC — users only access authorised cases and pages
* JWT authentication
* React frontend and Express REST API
* MySQL database

## Tech Stack

* **Frontend:** React
* **Backend:** Node.js, Express
* **Database:** MySQL
* **Authentication:** JWT, bcrypt
* **Architecture:** Monolithic
* **Containerisation:** Docker & Docker Compose
* **Environment:** Development

## Run with Docker

```bash, cmd
git clone <repository-url>
cd ficas
docker compose up --build -d
```

The frontend and backend services are orchestrated using Docker Compose.

## Purpose

FICAS digitises case workflows, reducing manual paperwork while ensuring users only access the cases and functionality assigned to their roles.
