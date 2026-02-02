# Design Decisions

## 1) Overview
- **Project:** User Authentication Service
- **Goal:** Implement registration, login, and protected profile management with clean architecture.
- **Scope covered in this submission:** all core requirements + request validation using class-validator

## 2) Architecture

### 2.1 Layers
- **Controllers:** request parsing, validation and response mapping. Validation was chosen to be put here to have a clear separation for the representation layer, and isolate the services for "happy path" business logic implementation.
- **Services:** "Happy path" business logic. Errors are handled independently, focusing the services entirely on business logic.
- **Repositories:** Repositories are meant to wrap.
- **Entities:** Representation of the data layer, with database-related hooks.
- **Middleware:** For seamless handling of general request logic, so far used only for JWT authorization (added explicitly per request).
- **Error handlers:** Isolated from the "main path" business logic, shifts focus on uniformity of handling and reusability, and avoids "forgot to catch the error" problems.

### 2.2 Why this structure
- Each layer is simplified to a single concern (representation, business logic, data). Only the class of errors when relevant, but the main focus stays on the "happy path" business logic.
- Every layer and each function are simple to test due to the narrowing down of responsibility. Tests are simple to understand and set up.
- Extensibility is straight-forward without requiring (a lot of) refactoring (the open-closed principle).

## 3) API Design

### 3.1 Endpoints Implemented
- `POST /users/register`
- `POST /users/login`
- `GET /users/profile
- `PUT or PATCH /users/profile`

## 4) Authentication & Security

### 4.1 Password Handling
- **Algorithm:** `scrypt`
- **Storage format:** `<salt>:<hash>`
- **Why:** Simple format, easy to parse and build. Hex was chosen to encode the bytes of both the salt and hash for simplicity, but any non-colon generating encoding would work (UTF-8 for example would be a problematic as it can generate a colon ":" breaking the parsing when spliting the "salt:hash" string).

### 4.2 JWT Strategy
- **Token payload:** User id only (thinner tokens, extensible later)
- **Token source:** `Authorization: Bearer <token>`
- **Middleware behavior:** Unauthorized error gets thrown if token does not exist or fails verification.
- **NOTE:** I came across inversify's [principal](https://github.com/inversify/inversify-express-utils?tab=readme-ov-file#principal) concept after the JWT middleware implementation, but I choose to keep it to focus on other deliverables. If I were to redo this I would instead go with the principal approach as it provides a simpler API.

### 4.3 Input Validation
- Validation kept simple, covering the bare minimum requirements. Validations are applied on DTO classes added directly in the controller classes for locality.

## 5) Data Model

### 5.1 User Entity
- `id`
- `email`
- `password`
- `firstName`
- `lastName`
- `createdAt`
- `updatedAt`

### 5.2 Persistence Choices
- **Current DB used in implementation:** The requirements state PostgreSQL as the database, but I went with sqlite for faster/easier iterations and setup.
- **Switching to PostgreSQL:** To switch to PostgreSQL would be very straight forward, as no SQLITE specific syntax and/or types have been used, and everything has been kept PostgreSQL compatible. The UUID database types would be the only thing that changes (as SQLITE just uses varchar, while Postgres has a dedicated UUID type), but that would not be noticed.
- **DB Migrations:** I have excluded database migrations from my implementation for faster iterations, but the migration generation should be very straightforward with the TypeORM cli, if pure SQL-based migrations are acceptable. If TypeORM utilities are preferred in migrations, it would be a little bit more work, but still pretty straight forward to implement manually.

## 6) Error Handling
- **Rationale:** Error handling should be uniform based on the category (or class) of errors. This allows for generalization of the handling and minimizing the reptitiveness of handling logic. This usually results in better representation of the errors themselves in the case of client errors.
- **Error types used:** BaseError, ClientError, UnauthorizedError, ValidationFailureError, NotFoundError
- **How validation errors are returned:** Validation errors are returned as an object with property with the failing validation as the key and the value as an array of error messages. The uniformity of this format allows for a generic approach for handling this in the frontend as well.
- **How unknown errors are handled:** When an unspecified error occurs (not explicitly defined) the fallback handler logs it and responds with an Internal server error. Further work is needed to provide logging, monitoring and alerting for Internal server errors in general.

## 7) What I Would Improve Next
- **Add rate limiting:** Rate limiting would be on top of the list, especially for unauthorized endpoints (login and registration), to limit denial of service attack attempts, and general exploitation (e.g. brute-forcing login).
- **Add refresh tokens:** Refresh tokens + mechanism would come next as long-lived access tokens make exploits easier.
- **Add testing utilities:** Mocking helps one write easy unit tests, but not necessarily effective ones. Over time the mocks become more complicated, rigid, and require maintenance of their own. I am a strong believer of the philosophy of more intentional and speciic mocking (mocking the file system, a network call, etc.). Usually, the biggest hurdles that make mocking easier, have a lot to do with testing utilties, mostly data. I would focus on providing a fake data generator (faker) that wraps around the different entities, allowing a quick setup of a database state that facilitates the needed test. This would also help in cases of integration/e2e tests for testing more specific edge cases.

