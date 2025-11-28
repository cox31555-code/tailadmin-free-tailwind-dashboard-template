const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Placeholder for Zapier MCP integration
// In a production environment, these would call the actual Zapier MCP endpoints
// For now, we'll provide sample data structure that matches what Zapier returns

const mockConversations = [
  {
    session_id: 'session_001',
    visitor: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    state: 'active',
    created_at: new Date(Date.now() - 3600000),
    messages: [
      {
        id: 'msg_001',
        from: 'visitor',
        content: 'Hello, I need help with my insurance claim',
        timestamp: new Date(Date.now() - 600000),
        author: 'John Doe'
      },
      {
        id: 'msg_002',
        from: 'operator',
        content: 'Hi John! I\'d be happy to help. Can you provide your policy number?',
        timestamp: new Date(Date.now() - 300000),
        author: 'Support Agent'
      },
      {
        id: 'msg_003',
        from: 'visitor',
        content: 'Sure, it\'s LP-2024-001234',
        timestamp: new Date(Date.now() - 60000),
        author: 'John Doe'
      }
    ]
  },
  {
    session_id: 'session_002',
    visitor: {
      name: 'Sarah Smith',
      email: 'sarah@example.com'
    },
    state: 'active',
    created_at: new Date(Date.now() - 7200000),
    messages: [
      {
        id: 'msg_101',
        from: 'visitor',
        content: 'When will my claim be processed?',
        timestamp: new Date(Date.now() - 1800000),
        author: 'Sarah Smith'
      },
      {
        id: 'msg_102',
        from: 'operator',
        content: 'Claims typically take 5-7 business days. I\'ll check your status.',
        timestamp: new Date(Date.now() - 900000),
        author: 'Support Agent'
      }
    ]
  }
];

// Webhook tracking for real Crisp messages
const webhookMessages = new Map();

// Get all conversations
// In production, call: mcp__zapier__crisp_search_for_conversation
app.get('/api/crisp/conversations', async (req, res) => {
  try {
    // TODO: In production, replace with actual Zapier MCP call
    // const result = await mcp__zapier__crisp_search_for_conversation({ query: '' });
    
    // Add any messages received via webhooks
    mockConversations.forEach(conv => {
      if (webhookMessages.has(conv.session_id)) {
        conv.messages.push(...webhookMessages.get(conv.session_id));
      }
    });

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
// In production, call: mcp__zapier__crisp_send_operator_text_message
app.post('/api/crisp/send-message', async (req, res) => {
  try {
    const { session_id, content } = req.body;

    if (!session_id || !content) {
      return res.status(400).json({ success: false, error: 'Missing session_id or content' });
    }

    // TODO: In production, use mcp__zapier__crisp_send_operator_text_message
    // const result = await mcp__zapier__crisp_send_operator_text_message({
    //   session_id,
    //   content,
    //   nickname: 'Support Agent'
    // });

    const conversation = mockConversations.find(c => c.session_id === session_id);
    if (conversation) {
      const newMessage = {
        id: `msg_${Date.now()}`,
        from: 'operator',
        content: content,
        timestamp: new Date(),
        author: 'Support Agent'
      };
      conversation.messages.push(newMessage);
      
      // Also track in webhooks map for real-time updates
      if (!webhookMessages.has(session_id)) {
        webhookMessages.set(session_id, []);
      }
      webhookMessages.get(session_id).push(newMessage);
    }

    console.log(`Message sent to ${session_id}: ${content}`);

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
// In production, use: mcp__zapier__crisp_change_conversation_state
app.post('/api/crisp/create-ticket', async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ success: false, error: 'Missing session_id' });
    }

    // TODO: In production, call mcp__zapier__crisp_change_conversation_state
    // const result = await mcp__zapier__crisp_change_conversation_state({
    //   session_id,
    //   state: 'resolved'
    // });

    const conversation = mockConversations.find(c => c.session_id === session_id);
    if (conversation) {
      conversation.state = 'resolved';
    }

    console.log(`Ticket created for ${session_id}`);

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

// Receive webhook from live-chat.html
// This receives Crisp events from the webhook configured earlier
app.post('/api/crisp/webhook', (req, res) => {
  try {
    const { session_id, message } = req.body;
    
    console.log('Webhook received:', session_id, message?.content);
    
    // Add webhook message to tracking
    if (session_id && message) {
      if (!webhookMessages.has(session_id)) {
        webhookMessages.set(session_id, []);
      }
      webhookMessages.get(session_id).push({
        id: `webhook_msg_${Date.now()}`,
        from: message.from || 'visitor',
        content: message.content || message.messageContent,
        timestamp: new Date(message.timestamp),
        author: message.author || message.senderName || 'Visitor'
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'Crisp Admin API' });
});

app.listen(PORT, () => {
  console.log(`Crisp Admin API running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET  /api/crisp/conversations - List all conversations');
  console.log('  POST /api/crisp/send-message - Send operator message');
  console.log('  POST /api/crisp/create-ticket - Create ticket from conversation');
  console.log('  POST /api/crisp/webhook - Receive webhook from live-chat.html');
});
