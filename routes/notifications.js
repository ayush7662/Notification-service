const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { addNotificationToQueue } = require('../queue/notificationQueue');
const { createUser } = require('../services/notificationService');

// POST /users/:id
router.post('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { email, phone } = req.body;

  try {
    await createUser(id, email, phone);
    res.json({ status: 'User created or updated', userId: id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /notifications
router.post('/', (req, res) => {
  // Check if req.body is defined
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }

  const { userId, type, content } = req.body;

  // Validate input
  if (!userId || !type || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!['email', 'sms', 'in-app'].includes(type)) {
    return res.status(400).json({ error: 'Invalid notification type' });
  }

  // Check if user exists
  db.get('SELECT id FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'User not found' });

    // Store notification in SQLite
    const createdAt = new Date().toISOString();
    db.run(
      `INSERT INTO notifications (userId, type, content, status, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [userId, type, content, 'pending', createdAt],
      function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });

        // Add to queue
        addNotificationToQueue({ id: this.lastID, userId, type, content });
        res.json({ status: 'Notification queued', notificationId: this.lastID });
      }
    );
  });
});

// GET /users/:id/notifications
router.get('/users/:id', (req, res) => {
  const { id } = req.params;
  const { type } = req.query;

  // Build query dynamically
  let query = 'SELECT * FROM notifications WHERE userId = ?';
  const params = [id];
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ notifications: rows });
  });
});

module.exports = router;