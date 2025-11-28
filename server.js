const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mock conversation storage (in production, use a database)
const mockConversations = [
  {
    session_id: 'session_001',
    visitor: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    state: 'active',
    messages: [
      {
        id: 'msg_001',
        from: 'visitor',
        content: 'Hello, I need help with my insurance policy',
        timestamp: new Date(Date.now() - 10000)
      },
      {
        id: 'msg_002',
        from: 'operator',
        content: 'Hi John! I\'d be happy to help. What seems to be the issue?',
        timestamp: new Date(Date.now() - 5000)
      }
    ]
  }
];

// Get all conversations
app.get('/api/crisp/conversations', async (req, res) => {
  try {
    // In production, call Zapier's crisp_search_for_conversation
    // For now, return mock data
    res.json({
      success: true,
      conversations: mockConversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send operator message
app.post('/api/crisp/send-message', async (req, res) => {
  try {
    const { session_id, content } = req.body;

    if (!session_id || !content) {
      return res.status(400).json({ success: false, error: 'Missing session_id or content' });
    }

    // In production, use mcp__zapier__crisp_send_operator_text_message
    // For now, simulate sending a message
    const conversation = mockConversations.find(c => c.session_id === session_id);
    if (conversation) {
      conversation.messages.push({
        id: `msg_${Date.now()}`,
        from: 'operator',
        content: content,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create ticket from conversation
app.post('/api/crisp/create-ticket', async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ success: false, error: 'Missing session_id' });
    }

    // In production, use mcp__zapier__crisp_change_conversation_state
    // to set state to "resolved" and potentially create a ticket system
    const conversation = mockConversations.find(c => c.session_id === session_id);
    if (conversation) {
      conversation.state = 'ticket_created';
    }

    res.json({
      success: true,
      message: 'Ticket created successfully',
      ticket_id: `ticket_${Date.now()}`
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
