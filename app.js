require('dotenv').config();
const express = require('express');
const notificationRoutes = require('./routes/notifications');

const app = express();

app.use(express.json()); // Parses JSON request bodies

app.use('/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Notification Service API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});