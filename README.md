# Slot Swapper Backend

A real-time slot swapping system built with Node.js, Express, MongoDB, and Socket.IO. This application allows users to manage their time slots and swap them with other users in real-time.

## Features

- User authentication with JWT
- Real-time notifications using Socket.IO
- CRUD operations for events/time slots
- Slot swapping system with request/response mechanism
- Real-time status updates for swap requests

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.IO for real-time communications
- JWT for authentication
- bcrypt for password hashing

## Prerequisites

- Node.js (v14 or higher)
- MongoDB instance
- npm or yarn

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd Slot-Swapper-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login user |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events for current user |
| GET | `/api/events/:id` | Get specific event |
| POST | `/api/events` | Create new event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |

### Swaps

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/swaps/swappable-slots` | Get all available slots for swapping |
| POST | `/api/swaps/swap-request` | Create a new swap request |
| GET | `/api/swaps/incoming` | Get incoming swap requests |
| GET | `/api/swaps/outgoing` | Get outgoing swap requests |
| POST | `/api/swaps/swap-response/:requestId` | Respond to a swap request |

## Socket Events

### Client to Server
- `markAsRead`: Mark swap requests as read
- `disconnect`: Handle client disconnection

### Server to Client
- `newSwapRequest`: Notify user of new swap request
- `swapRequestUpdate`: Notify user of swap request status change

## Request/Response Examples

### Create Event
```json
POST /api/events
{
  "title": "Meeting with Team",
  "startTime": "2023-09-20T10:00:00Z",
  "endTime": "2023-09-20T11:00:00Z"
}
```

### Create Swap Request
```json
POST /api/swaps/swap-request
{
  "mySlotId": "slot_id_1",
  "theirSlotId": "slot_id_2"
}
```

## Design Choices

1. **Real-time Updates**: Socket.IO was chosen for real-time communications to provide instant notifications for swap requests and updates.

2. **Authentication**: JWT-based authentication was implemented for secure API access and socket connections.

3. **MongoDB**: Used for its flexibility with document-based structure and good integration with Node.js.

## Challenges and Solutions

1. **Real-time Authentication**: Implemented socket middleware to authenticate connections using JWT tokens.

2. **Race Conditions**: Handled concurrent swap requests by implementing status checks and database transactions.

3. **Event Status Management**: Created a state machine approach for event statuses (BUSY, SWAPPABLE, SWAP_PENDING) to manage the swap lifecycle.

## Future Improvements

- Add rate limiting for API endpoints
- Implement email notifications
- Add pagination for events and swap requests
- Add support for recurring events
- Implement conflict resolution for overlapping swap requests