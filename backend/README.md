# Habit Tracker Backend

A REST API for creating, listing, completing, and deleting habits. The service stores habits in a Neon PostgreSQL database, tracks completion streaks, and applies a global Upstash Redis rate limit to incoming requests.

## Features

- Creates habits with a user ID and title.
- Retrieves a user's habits, ordered by newest first.
- Marks a habit as complete and updates its streak.
- Prevents a habit from being completed more than once on the same day.
- Deletes habits by ID.
- Creates the `habits` table automatically when the server starts.
- Provides a health-check endpoint.
- Applies a global sliding-window rate limiter to all requests.

## Tech Stack

- Node.js
- JavaScript (ES modules)
- Express.js
- Neon serverless PostgreSQL (`@neondatabase/serverless`)
- Upstash Redis and rate limiting (`@upstash/redis`, `@upstash/ratelimit`)
- dotenv
- Nodemon for local development

## Project Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js                 # Neon database client and schema initialization
│   │   └── upstash.js            # Upstash Redis rate-limit configuration
│   ├── controllers/
│   │   └── habitsController.js   # Habit request handlers and database queries
│   ├── middleware/
│   │   └── rateLimiter.js        # Global Express rate-limiting middleware
│   ├── routes/
│   │   └── habitsRoute.js        # Habit API route definitions
│   └── server.js                 # Express application and server startup
├── .gitignore
├── package.json
└── package-lock.json
```

## API Endpoints

All habit routes are prefixed with `/api/habits`.

### Health

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Returns the API health status. |

**Example response — `200 OK`**

```json
{
  "status": "ok"
}
```

### Habits

#### Create a habit

`POST /api/habits`

Creates a habit. Both `user_id` and `title` are required in the JSON request body.

```json
{
  "user_id": "user-123",
  "title": "Read for 20 minutes"
}
```

**Example response — `201 Created`**

```json
{
  "id": 1,
  "user_id": "user-123",
  "title": "Read for 20 minutes",
  "streak": 0,
  "last_completed": null,
  "created_at": "2026-09-19"
}
```

If either required field is missing, the API returns:

```json
{
  "message": "user_id and title are required"
}
```

#### Get a user's habits

`GET /api/habits/:userId`

Returns all habits whose `user_id` matches `:userId`, ordered by `created_at` in descending order.

**Example request**

```text
GET /api/habits/user-123
```

**Example response — `200 OK`**

```json
[
  {
    "id": 1,
    "user_id": "user-123",
    "title": "Read for 20 minutes",
    "streak": 0,
    "last_completed": null,
    "created_at": "2026-09-19"
  }
]
```

#### Complete a habit

`PUT /api/habits/:id/complete`

Marks the habit as completed for the current database date and returns the updated habit.

- A habit completed yesterday has its streak incremented.
- Any other prior completion state starts the streak at `1`.
- A habit already completed today returns `400 Bad Request`.

**Example request**

```text
PUT /api/habits/1/complete
```

**Example response — `200 OK`**

```json
{
  "id": 1,
  "user_id": "user-123",
  "title": "Read for 20 minutes",
  "streak": 1,
  "last_completed": "2026-09-19",
  "created_at": "2026-09-19"
}
```

**Possible error responses**

```json
{ "message": "Habit not found" }
```

```json
{ "message": "Habit already completed today" }
```

#### Delete a habit

`DELETE /api/habits/:id`

Deletes a habit by its ID.

**Example request**

```text
DELETE /api/habits/1
```

**Example response — `200 OK`**

```json
{
  "message": "Habit deleted successfully"
}
```

If no matching habit exists, the API returns:

```json
{
  "message": "Habit not found"
}
```

## Database

The API uses Neon serverless PostgreSQL. On startup, it creates the following table when it does not already exist:

| Column | Type | Constraints / default |
| --- | --- | --- |
| `id` | `SERIAL` | Primary key |
| `user_id` | `VARCHAR(255)` | Required |
| `title` | `VARCHAR(255)` | Required |
| `streak` | `INT` | Defaults to `0` |
| `last_completed` | `DATE` | Nullable |
| `created_at` | `DATE` | Required; defaults to the current date |

The current schema stores `user_id` as a string and does not define a separate users table or foreign-key relationship.

## Environment Variables

Create a `.env` file in the `backend` directory. Do not commit it; `.env` is ignored by Git.

```env
PORT=
DATABASE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

`PORT` is optional because the server defaults to `5001`. The other variables configure the Neon database connection and Upstash Redis client.

## Installation

```bash
git clone <repository-url>
cd <project-folder>/backend
npm install
```

Then create `backend/.env`, add the required environment variable values, and start the development server:

```bash
npm run dev
```

## Running the Server

The project currently provides one npm script:

```bash
npm run dev
```

This runs `nodemon src/server.js`. Before listening for requests, the server initializes the `habits` table in the configured database.

## API Usage

Create a habit:

```bash
curl -X POST http://localhost:5001/api/habits \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user-123","title":"Read for 20 minutes"}'
```

Retrieve that user's habits:

```bash
curl http://localhost:5001/api/habits/user-123
```

Complete a habit:

```bash
curl -X PUT http://localhost:5001/api/habits/1/complete
```

## Error Handling / Middleware

- `express.json()` parses JSON request bodies.
- The rate limiter is registered globally, so it runs before the health and habit routes.
- The Upstash rate limit is a sliding window of **100 requests per 60 seconds** using the shared key `my-rate-limit`.
- When the rate limit is exceeded, the API responds with `429 Too Many Requests`:

  ```json
  {
    "message": "Too many requests, please try again later."
  }
  ```

- Habit controller errors are logged on the server and return `500 Internal Server Error` with:

  ```json
  {
    "message": "Internal server error"
  }
  ```

## Future Improvements

Potential future improvements include request validation beyond required create fields, automated tests, user management, and a production start script.

## Author

**Fahd Rashdan**
