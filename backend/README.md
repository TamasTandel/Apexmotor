# Backend API Documentation

The backend is built with Express.js and uses Prisma for database interactions.

## Base URL

`http://localhost:5000/api`

## Authentication

Authentication is handled via JWT. Include the token in the `Authorization` header:
`Authorization: Bearer <token>`

## Endpoints

### Cars

- `GET /cars`: List all cars. Supports filtering by `make`, `bodyType`, `category`, `price`, etc.
- `GET /cars/:id`: Get details of a specific car.
- `POST /cars`: Create a new car (Admin only).
- `PATCH /cars/:id`: Update a car (Admin only).
- `DELETE /cars/:id`: Delete a car (Admin only).

### Users

- `POST /users/register`: Register a new user.
- `POST /users/login`: Login and receive a JWT.
- `GET /users/me`: Get current user profile.

### Admin

- `GET /admin/analytics`: Get dashboard stats (Admin only).

### Other

- `POST /contact`: Submit a contact form.
- `POST /finance`: Submit a finance application.
- `POST /service`: Book a service appointment.

## Validation

Request bodies are validated using Zod schemas. Invalid requests return a `400 Bad Request` with error details.

## Testing

Run `npm test` to execute the integration tests.
