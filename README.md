# Blog Fullstack Application

This repository contains a **fullstack blog application** composed of:

- **Backend**: ASP.NET Core Web API (.NET 6) with PostgreSQL, JWT authentication and roles
- **Frontend**: React + TypeScript using Vite

The steps below explain **how to run the entire project locally from scratch**.

---

## Prerequisites

Make sure you have the following installed:

- **.NET SDK 6**
- **Docker Desktop** (running)
- **Node.js 20+** (recommended via NVM)
- **npm**

---

## Project Structure

```
ProjectBlog/
│
├─ Blog.Api/        # Backend (.NET 6 API)
├─ Blog.Web/        # Frontend (React + Vite)
├─ docker-compose.yml
└─ README.md
```

---

# BACKEND – Blog.Api

## 1. Start PostgreSQL with Docker

From the project root (where `docker-compose.yml` is located):

```bash
docker compose up -d
```

To reset the database (delete all data):

```bash
docker compose down -v
docker compose up -d
```

---

## 2. Configure appsettings

In `Blog.Api/appsettings.Development.json` (or `appsettings.json`):

---

## 3. Apply database migrations

From the `Blog.Api` folder:

```bash
dotnet tool restore
dotnet tool run dotnet-ef database update
```

---

## 4. Run the API

```bash
cd Blog.Api
dotnet run
```

API:
- https://localhost:7280
- https://localhost:7280/swagger

---

## Default ADMIN user

- Email: admin@blog.com
- Password: Admin123!
- Roles: ADMIN, USER

---

# FRONTEND – Blog.Web

## 5. Install dependencies

```bash
cd Blog.Web
npm install
```

---

## 6. Configure API base URL

`Blog.Web/src/api/client.ts`:

```ts
baseURL: "https://localhost:7280"
```

---

## 7. Run frontend

```bash
npm run dev
```

Frontend:
- http://localhost:5173

---

## Roles & Permissions

- USER: manage own posts
- ADMIN: manage users, roles and all posts

---

## Screenshots

### Login
![Login screen](images/login.png)

### Register
![Register screen](images/register.png)

### Posts
![Posts screen](images/posts.png)

### Users (Admin)
![Users screen](images/users.png)

