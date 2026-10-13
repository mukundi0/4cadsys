# 4cadsys

A configurable school management system built with React, TypeScript, Django and PostgreSQL.

## Current milestone

React calls GET /api/health/ and displays the Django connection message. Vite forwards /api requests to Django during development. This endpoint checks communication between the apps; it does not query the database.

Admissions, finance, academics and the other planned school workflows are not implemented yet. See PROJECT_HANDOFF.md for the agreed scope.

## Tools needed

- Python 3.13
- Node.js and npm (the existing project was checked with Node 26)
- Docker Desktop, running with Docker Compose
- Git

The commands below use Windows PowerShell. Run them from the project root unless stated otherwise.

## First setup on another computer

### 1. Download the project

~~~powershell
git clone https://github.com/mukundi0/4cadsys.git
cd 4cadsys
~~~

If you already have this project open, use its existing folder instead. On the original computer it is C:\Users\MUKUNDI\Desktop\ams.

### 2. Install the Python dependencies

~~~powershell
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
~~~

The virtual environment keeps this project's Python packages separate from other projects. Calling its Python directly avoids needing to activate it.

### 3. Create your local configuration

~~~powershell
Copy-Item .env.example .env
~~~

Only run that copy for a new checkout without an existing .env. Open .env and replace the password and Django secret placeholders. Choose a long, random Django secret. Keep these values private; Git ignores .env.

The POSTGRES settings are used when Docker first creates the database volume. Changing them later does not change credentials in an existing database.

### 4. Start the database and prepare its tables

~~~powershell
docker compose up -d db
.\.venv\Scripts\python.exe backend/manage.py migrate
~~~

Docker runs PostgreSQL in the background. Migrations create the database tables Django needs. If PostgreSQL is still starting, wait briefly and retry the migration.

### 5. Install the frontend dependencies

~~~powershell
cd frontend
npm.cmd ci
cd ..
~~~

npm.cmd avoids PowerShell execution-policy issues with npm.ps1. The lockfile records the frontend dependency versions.

## Run the project each day

In a terminal at the project root:

~~~powershell
docker compose up -d db
.\.venv\Scripts\python.exe backend/manage.py runserver
~~~

Keep that terminal open. In a second terminal at the project root:

~~~powershell
cd frontend
npm.cmd run dev
~~~

Open the local URL Vite prints, usually http://localhost:5173. You should see **Django is connected!**

You can also open http://127.0.0.1:8000/api/health/ directly to see the JSON response. If the frontend cannot connect, confirm Django is running on port 8000 and restart Vite after changing its configuration. Use Ctrl+C in each terminal to stop a development server.

## Checks

From the project root:

~~~powershell
.\.venv\Scripts\python.exe backend/manage.py check
~~~

From frontend:

~~~powershell
npm.cmd run build
npm.cmd run lint
~~~

## Branch workflow

main holds completed, checked work. Create a branch for each task, such as chore/project-setup or feature/school-settings. Commit the changes, push the branch, and review a pull request before merging into main.

~~~powershell
git push -u origin chore/project-setup
~~~

## Development limits

This is a local development setup. Django DEBUG is enabled, and the Vite API proxy only operates during development. Production hosting, API routing and deployment settings still need to be configured.

Secrets, the Python virtual environment, node_modules, build output, local databases and uploaded media are excluded from Git. .env.example contains placeholders only.
