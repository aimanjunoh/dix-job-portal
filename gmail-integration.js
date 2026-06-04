// ============================================
// DIX Job Portal - Gmail Integration Script
// ============================================
// Setup instructions:
// 1. Go to https://script.google.com
// 2. Create a new project
// 3. Paste this entire code
// 4. Edit the CONFIG section below
// 5. Run setup() once to create the label
// 6. Set up a trigger (see instructions at bottom)
// ============================================

// === CONFIGURATION ===
var CONFIG = {
  // Your DIX Job Portal webhook URL
  WEBHOOK_URL: 'https://dix-job-portal.vercel.app/api/create-from-email',
  
  // Webhook secret (must match what's set in Vercel)
  WEBHOOK_SECRET: 'dix-gmail-secret-2024',
  
  // Gmail label to watch for
  LABEL_NAME: 'Request Job',
  
  // Property to track last processed email (don't change)
  LAST_CHECK_KEY: 'dix_last_check',
};

/**
 * Run this once to create the Gmail label
 */
function setup() {
  var label = GmailApp.getUserLabelByName(CONFIG.LABEL_NAME);
  if (!label) {
    label = GmailApp.createLabel(CONFIG.LABEL_NAME);
    Logger.log('Label "' + CONFIG.LABEL_NAME + '" created successfully!');
  } else {
    Logger.log('Label "' + CONFIG.LABEL_NAME + '" already exists.');
  }
  Logger.log('');
  Logger.log('Next step: Set up a trigger:');
  Logger.log('1. Click the clock icon (Triggers) in the left sidebar');
  Logger.log('2. Click "+ Add Trigger"');
  Logger.log('3. Function: processNewRequests');
  Logger.log('4. Event source: Time-driven');
  Logger.log('5. Type: Minutes timer');
  Logger.log('6. Interval: Every 5 minutes');
  Logger.log('7. Click Save');
}

/**
 * Main function - checks for new emails with the label and sends to DIX Portal
 * Set this to run on a time trigger (every 5 minutes)
 */
function processNewRequests() {
  var label = GmailApp.getUserLabelByName(CONFIG.LABEL_NAME);
  if (!label) {
    Logger.log('Label "' + CONFIG.LABEL_NAME + '" not found. Run setup() first.');
    return;
  }
  
  var threads = label.getThreads();
  var processedCount = 0;
  
  var properties = PropertiesService.getScriptProperties();
  var processedIds = properties.getProperty('processed_ids') || '';
  var processedList = processedIds.split(',').filter(function(id) { return id.length > 0; });
  
  for (var i = 0; i < threads.length; i++) {
    var thread = threads[i];
    var threadId = thread.getId();
    
    // Skip if already processed
    if (processedList.indexOf(threadId) !== -1) {
      continue;
    }
    
    var messages = thread.getMessages();
    var firstMessage = messages[0];
    
    // Extract email data
    var sender = firstMessage.getFrom();
    var senderEmail = extractEmail(sender);
    var senderName = extractName(sender);
    var subject = firstMessage.getSubject();
    var body = firstMessage.getPlainBody();
    var date = firstMessage.getDate().toISOString();
    
    // Skip if sender is yourself
    var myEmail = Session.getActiveUser().getEmail();
    if (senderEmail.toLowerCase() === myEmail.toLowerCase()) {
      addToProcessed(processedList, threadId);
      continue;
    }
    
    // Detect urgency from subject
    var urgency = 'Normal';
    var subjectLower = subject.toLowerCase();
    if (subjectLower.indexOf('urgent') !== -1 || subjectLower.indexOf('segera') !== -1) {
      urgency = 'Urgent';
    }
    if (subjectLower.indexOf('critical') !== -1 || subjectLower.indexOf('emergency') !== -1 || subjectLower.indexOf('kecemasan') !== -1) {
      urgency = 'Critical';
    }
    
    // Clean up body (remove signatures, excessive whitespace)
    body = body.substring(0, 2000); // Limit body length
    body = body.replace(/\r
/g, '
').replace(/
{3,}/g, '

').trim();
    
    // Send to DIX Portal
    var success = sendToPortal({
      sender_name: senderName,
      sender_email: senderEmail,
      subject: subject.replace(/^\[?\s*(request|job|req)\s*[\]:\-]?\s*/i, ''), // Clean subject
      body: body,
      date: date,
      urgency: urgency,
      category: 'Email',
    });
    
    if (success) {
      processedCount++;
      addToProcessed(processedList, threadId);
      
      // Remove the label to mark as processed
      thread.removeLabel(label);
      
      // Add a "Processed" label
      var processedLabel = GmailApp.getUserLabelByName('DIX - Processed');
      if (!processedLabel) {
        processedLabel = GmailApp.createLabel('DIX - Processed');
      }
      thread.addLabel(processedLabel);
      
      Logger.log('✓ Created request from: ' + senderName + ' (' + subject + ')');
    } else {
      Logger.log('✗ Failed to create request from: ' + senderName + ' (' + subject + ')');
    }
  }
  
  // Save processed list (keep last 500 to avoid property size limits)
  if (processedList.length > 500) {
    processedList = processedList.slice(-500);
  }
  properties.setProperty('processed_ids', processedList.join(','));
  
  if (processedCount > 0) {
    Logger.log('');
    Logger.log('Processed ' + processedCount + ' new request(s)');
  }
}

/**
 * Send email data to DIX Portal API
 */
function sendToPortal(data) {
  try {
    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-webhook-secret': CONFIG.WEBHOOK_SECRET,
      },
      payload: JSON.stringify(data),
      muteHttpExceptions: true,
    };
    
    var response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, options);
    var result = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() === 200 && result.success) {
      Logger.log('  → ' + result.request_id + ' created');
      return true;
    } else {
      Logger.log('  → Error: ' + (result.error || response.getResponseCode()));
      return false;
    }
  } catch (e) {
    Logger.log('  → Exception: ' + e.message);
    return false;
  }
}

/**
 * Extract email address from "Name <email>" format
 */
function extractEmail(from) {
  var match = from.match(/<(.+?)>/);
  return match ? match[1] : from;
}

/**
 * Extract name from "Name <email>" format
 */
function extractName(from) {
  var match = from.match(/^(.+?)\s*</);
  return match ? match[1].replace(/"/g, '').trim() : from.split('@')[0];
}

/**
 * Add thread ID to processed list
 */
function addToProcessed(list, id) {
  if (list.indexOf(id) === -1) {
    list.push(id);
  }
}
