

# Notification Service

A Node.js-based API for sending email, SMS, and in-app notifications to users, built with Express, SQLite, Bull (Redis queue), Nodemailer, and Twilio. The service supports user registration, notification queuing with retries, and retrieval of notification history, meeting the requirements of a scalable notification system.

## for creating an user please used phone number as +918709610659 ##

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Running the Service](#running-the-service)
- [Testing with Postman](#testing-with-postman)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)
- [Deliverables](#deliverables)
- [License](#license)

- ## Live url
-  https://notification-service-oo9u.onrender.com

-  ## Github repository
-  https://github.com/ayush7662/Notification-service.git

## Overview
The Notification Service allows sending notifications to users via:
- **Email**: Sent from your Gmail account to a user’s email (stored in SQLite).
- **SMS**: Sent from your Twilio phone number to a user’s verified phone number.
- **In-App**: Stored in SQLite for retrieval.

Notifications are queued using Bull (Redis) with up to 3 retries for failed deliveries. Users are registered with email/phone details, and notifications are sent to these contacts using your configured credentials.

## Features
- User registration with email/phone (`POST /notifications/users/{id}`).
- Send email, SMS, and in-app notifications (`POST /notifications`).
- Retrieve notification history (`GET /users/:id/notifications`).
- Queue-based processing with retries for failed notifications.
- Input validation and error handling.
- SQLite storage for users and notifications.

## Tech Stack
- **Node.js** with **Express** (API framework)
- **SQLite** (database for users and notifications)
- **Bull** with **Redis** (queue for notifications)
- **Nodemailer** (email via Gmail SMTP)
- **Twilio** (SMS notifications)
- **Nodemon** (development server)
- **Postman** (API testing)

## Prerequisites
- **Node.js** (v16 or higher)
- **Redis** (local or cloud, e.g., Redis Labs)
- **Gmail Account** with 2-Step Verification and App Password
- **Twilio Account** (trial or paid, with a phone number)
- **Postman** for testing
- **SQLite** (included via `sqlite3` package)
- **Git** for version control

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/notification-service.git
   cd notification-service
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```
   - Ensures `express`, `sqlite3`, `bull`, `nodemailer`, `twilio`, `dotenv`, `nodemon` are installed.

3. **Configure Environment Variables**:
   - Create a `.env` file in the root directory:
     ```env
     GMAIL_USER=your-email@gmail.com
     GMAIL_PASS="your-app-password"
     TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     TWILIO_AUTH_TOKEN=your-auth-token
     TWILIO_PHONE=+1234567890
     REDIS_URL=redis://127.0.0.1:6379
     PORT=3000
     ```
   - **Gmail**:
     - Enable 2-Step Verification in [myaccount.google.com](https://myaccount.google.com) > Security.
     - Generate an App Password (Security > App Passwords > App: Mail, Device: Other).
     - Quote `GMAIL_PASS` if it contains `#` (e.g., `"password#123"`).
   - **Twilio**:
     - Get `TWILIO_SID`, `TWILIO_AUTH_TOKEN` from [console.twilio.com](https://console.twilio.com).
     - Set `TWILIO_PHONE` to your Twilio number (e.g., `+1234567890`).
     - Verify recipient phone numbers in Twilio Console (trial accounts).
   - **Redis**:
     - Use local Redis (`redis://127.0.0.1:6379`) or a cloud URL (e.g., Redis Labs).

4. **Set Up Redis**:
   - **Local**:
     ```bash
     redis-server
     redis-cli ping
     ```
     - Expected: `PONG`
   - **Cloud**: Update `REDIS_URL` in `.env` with your Redis Labs URL.

5. **Verify Twilio Phone Numbers**:
   - For trial accounts, verify recipient phone numbers:
     - Go to [console.twilio.com](https://console.twilio.com) > Phone Numbers > Manage > Verified Caller IDs.
     - Add and verify numbers (e.g., `+918709610659`).

## Running the Service
1. Start the server:
   ```bash
   npm start
   ```
   - Expected output:
     ```
     Server running on port 3000
     Connected to SQLite database.
     Twilio connection successful
     Gmail SMTP connection successful
     ```
2. Test the root endpoint:
   ```bash
   curl http://localhost:3000
   ```
   - Expected: `{"message":"Notification Service API"}`

## Testing with Postman

1. **Import Collection**:
   - Import `postman_collection.json` (in the repository) into Postman.
   - Create an environment “Local” with `base_url: http://localhost:3000`.

2. **Test Cases**:

   - **Create User (POST /notifications/users/{id})**:
     - URL: `{{base_url}}/notifications/users/testuser1`
     - Method: POST
     - Headers: `Content-Type: application/json`
     - Body:
       ```json
       {
         "email": "xyz@gmail.com",
         "phone": "+918709610659"
       }
       ```
     - Expected: `200 OK`, `{"status":"User created or updated","userId":"testuser1"}`
     - Verify: `sqlite3 notifications.db "SELECT * FROM users;"`

   - **Send SMS Notification (POST /notifications)**:
     - URL: `{{base_url}}/notifications`
     - Method: POST
     - Headers: `Content-Type: application/json`
     - Body:
       ```json
       {
         "userId": "testuser1",
         "type": "sms",
         "content": "Test SMS notification"
       }
       ```
     - Expected: `200 OK`, `{"status":"Notification queued","notificationId":1}`
     - Verify: SMS received on `+91your-verified-number`, console logs `SMS sent to +91your-verified-number`.

   - **Send Email Notification (POST /notifications)**:
     - Body:
       ```json
       {
         "userId": "testuser1",
         "type": "email",
         "content": "Test email notification"
       }
       ```
     - Expected: `200 OK`, `{"status":"Notification queued","notificationId":2}`
     - Verify: Email received at `gauravjikar070806@gmail.com`.

   - **Send In-App Notification (POST /notifications)**:
     - Body:
       ```json
       {
         "userId": "testuser1",
         "type": "in-app",
         "content": "Test in-app notification"
       }
       ```
     - Expected: `200 OK`, `{"status":"Notification queued","notificationId":3}`
     - Verify: Console logs `In-app notification stored for user testuser1`.

   - **Retrieve Notifications (GET /users/:id/notifications)**:
     - URL: `{{base_url}}/users/testuser1/notifications`
     - Method: GET
     - Optional Query: `type=sms`
     - Expected: `200 OK`, JSON array of notifications.
     - Verify: Matches SQLite `notifications` table.

   - **Edge Cases**:
     - Missing body: `POST /notifications`, no body → `400`, `{"error":"Request body is missing"}`
     - Invalid user: `{"userId":"invalid","type":"sms","content":"Test"}` → `404`, `{"error":"User not found"}`
     - Invalid type: `{"userId":"testuser1","type":"invalid","content":"Test"}` → `400`, `{"error":"Invalid notification type"}`

3. **Test Retries**:
   - Set invalid `TWILIO_AUTH_TOKEN` in `.env`, send SMS, check console for 3 retries.
   - Restore correct `TWILIO_AUTH_TOKEN` and retest.

## API Endpoints

| Endpoint | Method | Description | Body Example |
|----------|--------|-------------|--------------|
| `/notifications/users/{id}` | POST | Create/update user | `{"email":"user@example.com","phone":"+1234567890"}` |
| `/notifications` | POST | Send notification | `{"userId":"testuser1","type":"sms","content":"Test"}` |
| `/users/{id}/notifications` | GET | Retrieve notifications | Query: `?type=sms` (optional) |

