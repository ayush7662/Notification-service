const Bull = require('bull');
const { sendNotification } = require('../services/notificationService');
const db = require('../db/database');

const notificationQueue = new Bull('notifications', process.env.REDIS_URL);

notificationQueue.process(async (job, done) => {
  const { id, userId, type, content } = job.data;
  try {
    const result = await sendNotification({ id, userId, type, content });
    db.run(
      `UPDATE notifications SET status = ? WHERE id = ?`,
      [result.status, id],
      (err) => {
        if (err) console.error('Error updating notification status:', err.message);
      }
    );
    done();
  } catch (error) {
    console.error('Error processing notification:', error.message);
    done(error);
  }
});

notificationQueue.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed with error: ${err.message}`);
});

const addNotificationToQueue = (notification) => {
  notificationQueue.add(notification, {
    attempts: 3,
    backoff: { type: 'fixed', delay: 5000 }
  });
};

module.exports = { addNotificationToQueue };