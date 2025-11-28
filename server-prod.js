const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Load real conversations from Zapier/Crisp
const loadConversations = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'conversations.json'), 'utf8');
    const conversations = JSON.parse(data).conversations || [];
    console.log(`Loaded ${conversations.length} conversations from storage`);
    return conversations;
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
};

const saveConversations = (conversations) => {
  try {
    fs.writeFileSync(
      path.join(__dirname, 'conversations.json'),
      JSON.stringify({ conversations }, null, 2)
    );
  } catch (error) {
    console.error('Error saving conversations:', error);
  }
};

// API endpoints for Crisp admin functionality
app.get('/api/crisp/conversations', (req, res) => {
  const conversations = loadConversations();
  res.json({
    success: true,
    conversations: conversations
  });
});

app.post('/api/crisp/send-message', (req, res) => {
  try {
    const { session_id, content } = req.body;

    if (!session_id || !content) {
      return res.status(400).json({ success: false, error: 'Missing session_id or content' });
    }

    const conversations = loadConversations();
    const conversation = conversations.find(c => c.session_id === session_id);

    if (conversation) {
      const newMessage = {
        id: `msg_${Date.now()}`,
        from: 'operator',
        content: content,
        timestamp: new Date().toISOString(),
        author: 'Support Agent'
      };
      conversation.messages.push(newMessage);
      conversation.updated_at = new Date().toISOString();
      saveConversations(conversations);
    }

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/crisp/create-ticket', (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ success: false, error: 'Missing session_id' });
    }

    const conversations = loadConversations();
    const conversation = conversations.find(c => c.session_id === session_id);

    if (conversation) {
      conversation.state = 'resolved';
      conversation.updated_at = new Date().toISOString();
      saveConversations(conversations);
    }

    res.json({ success: true, ticket_id: `ticket_${Date.now()}` });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Refresh conversations endpoint (for manual sync with Zapier)
app.post('/api/crisp/refresh', (req, res) => {
  console.log('Refresh requested - conversations in storage:', loadConversations().length);
  res.json({
    success: true,
    message: 'Refresh completed',
    count: loadConversations().length
  });
});

// Fallback to index.html for single-page app
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Production server running on http://localhost:${PORT}`);
});
