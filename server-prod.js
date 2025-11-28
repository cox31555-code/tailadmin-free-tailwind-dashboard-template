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

// Webhook endpoint for Zapier Chat Zap - Receives actions from dashboard
app.post('/api/webhook/crisp', (req, res) => {
  try {
    const data = req.body;
    console.log('Webhook action received:', data.action, 'Session:', data.session_id);

    // Handle action-based requests from dashboard
    if (data.action === 'send_message') {
      const conversations = loadConversations();
      const conversation = conversations.find(c => c.session_id === data.session_id);

      if (conversation) {
        const newMessage = {
          id: `msg_${Date.now()}`,
          from: 'operator',
          content: data.message,
          timestamp: new Date().toISOString(),
          author: data.operator || 'Support Agent'
        };
        conversation.messages.push(newMessage);
        conversation.updated_at = new Date().toISOString();
        saveConversations(conversations);
        console.log(`Message sent to conversation ${data.session_id}`);
        res.json({ success: true, message: 'Message sent' });
      } else {
        res.status(404).json({ success: false, error: 'Conversation not found' });
      }
    } else if (data.action === 'update_status') {
      const conversations = loadConversations();
      const conversation = conversations.find(c => c.session_id === data.session_id);

      if (conversation) {
        conversation.state = data.status;
        conversation.updated_at = new Date().toISOString();
        saveConversations(conversations);
        console.log(`Status updated to ${data.status} for conversation ${data.session_id}`);
        res.json({ success: true, message: 'Status updated' });
      } else {
        res.status(404).json({ success: false, error: 'Conversation not found' });
      }
    } else if (data.action === 'add_note') {
      const conversations = loadConversations();
      const conversation = conversations.find(c => c.session_id === data.session_id);

      if (conversation) {
        if (!conversation.notes) conversation.notes = [];
        conversation.notes.push({
          id: `note_${Date.now()}`,
          content: data.note,
          timestamp: new Date().toISOString(),
          author: data.operator || 'Support Agent'
        });
        conversation.updated_at = new Date().toISOString();
        saveConversations(conversations);
        console.log(`Note added to conversation ${data.session_id}`);
        res.json({ success: true, message: 'Note added' });
      } else {
        res.status(404).json({ success: false, error: 'Conversation not found' });
      }
    } else if (data.action === 'create_contact') {
      // Store contact data for Crisp
      res.json({ success: true, message: 'Contact action received' });
    } else if (data.conversations || data.conversation) {
      // Handle incoming conversation data from Crisp (via Zapier trigger)
      if (data.conversations) {
        const conversations = Array.isArray(data.conversations) ? data.conversations : [data.conversations];
        saveConversations(conversations);
        console.log(`Saved ${conversations.length} conversations from Crisp`);
        res.json({ success: true, message: 'Conversations updated', count: conversations.length });
      } else if (data.conversation) {
        const conversations = loadConversations();
        const existing = conversations.findIndex(c => c.id === data.conversation.id || c.session_id === data.conversation.session_id);

        if (existing >= 0) {
          conversations[existing] = data.conversation;
        } else {
          conversations.push(data.conversation);
        }

        saveConversations(conversations);
        console.log(`Updated conversation: ${data.conversation.id || data.conversation.session_id}`);
        res.json({ success: true, message: 'Conversation updated' });
      }
    } else {
      // Unknown payload structure - try to process as conversation data
      const conversations = loadConversations();
      const conversation = {
        id: data.id || data.session_id || `session_${Date.now()}`,
        session_id: data.session_id || data.id || `session_${Date.now()}`,
        visitor: data.visitor || { name: 'Unknown', email: data.email || '' },
        state: data.state || 'unresolved',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        messages: data.messages || [],
        unread: data.unread || { operator: 0, visitor: 0 },
        assigned_user_id: data.assigned_user_id || null
      };

      const existing = conversations.findIndex(c => c.id === conversation.id || c.session_id === conversation.session_id);
      if (existing >= 0) {
        conversations[existing] = conversation;
      } else {
        conversations.push(conversation);
      }

      saveConversations(conversations);
      console.log(`Processed conversation: ${conversation.id}`);
      res.json({ success: true, message: 'Conversation processed' });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
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
