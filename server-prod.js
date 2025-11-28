const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// API endpoints for Crisp admin functionality
app.get('/api/crisp/conversations', (req, res) => {
  res.json({
    success: true,
    conversations: [
      {
        id: 'conv_001',
        visitor: { name: 'John Doe', email: 'john@example.com' },
        state: 'active',
        messages: []
      }
    ]
  });
});

app.post('/api/crisp/send-message', (req, res) => {
  res.json({ success: true, message: 'Message sent' });
});

app.post('/api/crisp/create-ticket', (req, res) => {
  res.json({ success: true, ticket_id: `ticket_${Date.now()}` });
});

// Fallback to index.html for single-page app
app.get('/:path*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Production server running on http://localhost:${PORT}`);
});
