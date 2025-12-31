const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ============================================
// London Timezone Utility Functions
// ============================================
/**
 * Get current time in London timezone as ISO string
 */
const getLondonNowISO = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' })).toISOString();
};

/**
 * Convert a Date to London timezone representation and return as ISO string
 */
const convertToLondonTimeISO = (date) => {
  if (!date || !(date instanceof Date)) {
    return new Date().toISOString();
  }
  return new Date(date.toLocaleString('en-US', { timeZone: 'Europe/London' })).toISOString();
};

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
          timestamp: getLondonNowISO(),
          author: data.operator || 'Support Agent'
        };
        conversation.messages.push(newMessage);
        conversation.updated_at = getLondonNowISO();
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
        conversation.updated_at = getLondonNowISO();
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
          timestamp: getLondonNowISO(),
          author: data.operator || 'Support Agent'
        });
        conversation.updated_at = getLondonNowISO();
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
        created_at: data.created_at || getLondonNowISO(),
        updated_at: data.updated_at || getLondonNowISO(),
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

// Test endpoint to verify webhook is working
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is working',
    webhook_url: '/api/webhook/crisp',
    test_instructions: 'POST JSON data to /api/webhook/crisp with action field'
  });
});

// Test webhook with sample data
app.post('/api/test/webhook', (req, res) => {
  try {
    const testPayload = {
      action: 'send_message',
      session_id: 'session_test_12345',
      message: 'Test message from Builder.io dashboard',
      operator: 'Dashboard Agent',
      status: 'resolved',
      note: 'Test internal note',
      email: 'test@example.com',
      name: 'Test Customer',
      phone: '+1234567890',
      company: 'Test Company',
      segments: 'vip-customer',
      notepad: 'Test notepad content'
    };

    // Forward to webhook handler
    console.log('Testing webhook with payload:', testPayload);

    // Manually call webhook logic
    const data = testPayload;

    if (data.action === 'send_message') {
      const conversations = loadConversations();
      const conversation = conversations.find(c => c.session_id === data.session_id);

      if (!conversation) {
        // Create test conversation if it doesn't exist
        const newConversation = {
          id: data.session_id,
          session_id: data.session_id,
          visitor: {
            name: data.name || 'Test Customer',
            email: data.email || 'test@example.com'
          },
          state: data.status || 'unresolved',
          created_at: getLondonNowISO(),
          updated_at: getLondonNowISO(),
          messages: [],
          unread: { operator: 0, visitor: 0 }
        };
        conversations.push(newConversation);
      }

      const updatedConversation = conversations.find(c => c.session_id === data.session_id);
      if (updatedConversation) {
        const newMessage = {
          id: `msg_${Date.now()}`,
          from: 'operator',
          content: data.message,
          timestamp: getLondonNowISO(),
          author: data.operator || 'Support Agent'
        };
        updatedConversation.messages.push(newMessage);
        updatedConversation.updated_at = getLondonNowISO();
        saveConversations(conversations);
      }
    }

    res.json({
      success: true,
      message: 'Test webhook executed successfully',
      conversations_loaded: loadConversations().length
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fallback to index.html for single-page app
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Production server running on http://localhost:${PORT}`);
});
