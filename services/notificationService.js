const nodemailer = require('nodemailer');
const twilio = require('twilio');
const db = require('../db/database');

// Initialize Nodemailer transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Generate random email and phone if not provided
const generateEmail = (id) => `${id}@example.com`;
const generatePhone = () => {
  const digits = Math.floor(1000000 + Math.random() * 9000000); // 7-digit random
  return `+1555${digits}`; // US-like phone number
};

// Create or update user
const createUser = async (id, email, phone) => {
  return new Promise((resolve, reject) => {
    // Use provided or generated email/phone
    const finalEmail = email || generateEmail(id);
    const finalPhone = phone || generatePhone();

    // Validate email and phone formats (basic)
    if (!finalEmail.includes('@')) {
      return reject(new Error('Invalid email format'));
    }
    if (!finalPhone.match(/^\+\d{10,12}$/)) {
      return reject(new Error('Invalid phone format'));
    }

    // Insert or update user
    db.run(
      `INSERT OR REPLACE INTO users (id, email, phone) VALUES (?, ?, ?)`,
      [id, finalEmail, finalPhone],
      (err) => {
        if (err) {
          console.error('Error creating user:', err.message);
          return reject(new Error('Database error'));
        }
        resolve();
      }
    );
  });
};

const sendNotification = async (notification) => {
  const { id, userId, type, content } = notification;

  return new Promise((resolve, reject) => {
    db.get('SELECT email, phone FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        console.error('Error fetching user:', err.message);
        return reject(new Error('Database error'));
      }
      if (!user) {
        console.error('User not found:', userId);
        return reject(new Error('User not found'));
      }

      try {
        if (type === 'email') {
          await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: user.email,
            subject: 'Notification',
            text: content
          });
          console.log(`Email sent to ${user.email}`);
          resolve({ status: 'sent' });
        } else if (type === 'sms') {
          await twilioClient.messages.create({
            body: content,
            from: process.env.TWILIO_PHONE,
            to: user.phone
          });
          console.log(`SMS sent to ${user.phone}`);
          resolve({ status: 'sent' });
        } else if (type === 'in-app') {
          console.log(`In-app notification stored for user ${userId}`);
          resolve({ status: 'sent' });
        } else {
          reject(new Error('Invalid notification type'));
        }
      } catch (error) {
        console.error(`Error sending ${type} notification:`, error.message);
        reject(error);
      }
    });
  });
};

module.exports = { sendNotification, createUser };