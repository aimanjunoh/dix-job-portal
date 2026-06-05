// ============================================
// DIX Job Portal - Gmail Integration Script
// ============================================
// Setup instructions:
// 1. Go to https://script.google.com
// 2. Create a new project
// 3. Paste this entire code into Code.gs
// 4. Run setup() once to create the label
// 5. Set up a trigger for processNewRequests
// ============================================

// === CONFIGURATION ===
var CONFIG = {
  WEBHOOK_URL: 'https://dix-job-portal.vercel.app/api/create-from-email',
  WEBHOOK_SECRET: 'dix-gmail-secret-2024',
  LABEL_NAME: 'Request Job',
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
  Logger.log('Next: Set up a trigger for processNewRequests (every 5 minutes)');
}

/**
 * Main function - checks for new labeled emails and sends to DIX Portal
 */
function processNewRequests() {
  var label = GmailApp.getUserLabelByName(CONFIG.LABEL_NAME);
  if (!label) {
    Logger.log('Label not found. Run setup() first.');
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

    // Clean up body
    body = body.substring(0, 2000);
    body = body.split('\r\n').join('\n');
    var lines = body.split('\n');
    var cleanLines = [];
    var emptyCount = 0;
    for (var j = 0; j < lines.length; j++) {
      if (lines[j].trim() === '') {
        emptyCount++;
        if (emptyCount <= 2) cleanLines.push('');
      } else {
        emptyCount = 0;
        cleanLines.push(lines[j]);
      }
    }
    body = cleanLines.join('\n').trim();

    // Send to DIX Portal
    var success = sendToPortal({
      sender_name: senderName,
      sender_email: senderEmail,
      subject: subject,
      body: body,
      date: date,
      urgency: urgency,
      category: 'Email',
    });

    if (success) {
      processedCount++;
      addToProcessed(processedList, threadId);

      // Remove the label
      thread.removeLabel(label);

      // Add processed label
      var processedLabel = GmailApp.getUserLabelByName('DIX - Processed');
      if (!processedLabel) {
        processedLabel = GmailApp.createLabel('DIX - Processed');
      }
      thread.addLabel(processedLabel);

      Logger.log('Created request from: ' + senderName + ' (' + subject + ')');
    } else {
      Logger.log('Failed to create request from: ' + senderName + ' (' + subject + ')');
    }
  }

  // Save processed list (keep last 500)
  if (processedList.length > 500) {
    processedList = processedList.slice(-500);
  }
  properties.setProperty('processed_ids', processedList.join(','));

  if (processedCount > 0) {
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
      Logger.log('  -> ' + result.request_id + ' created');
      return true;
    } else {
      Logger.log('  -> Error: ' + (result.error || response.getResponseCode()));
      return false;
    }
  } catch (e) {
    Logger.log('  -> Exception: ' + e.message);
    return false;
  }
}

/**
 * Extract email address from "Name <email>" format
 */
function extractEmail(from) {
  var start = from.indexOf('<');
  var end = from.indexOf('>');
  if (start !== -1 && end !== -1) {
    return from.substring(start + 1, end);
  }
  return from;
}

/**
 * Extract name from "Name <email>" format
 */
function extractName(from) {
  var start = from.indexOf('<');
  if (start !== -1) {
    var name = from.substring(0, start).trim();
    name = name.replace(/"/g, '');
    return name.length > 0 ? name : from.substring(from.indexOf('<') + 1, from.indexOf('>')).split('@')[0];
  }
  return from.split('@')[0];
}

/**
 * Add thread ID to processed list
 */
function addToProcessed(list, id) {
  if (list.indexOf(id) === -1) {
    list.push(id);
  }
}

// ============================================
// OUTGOING EMAIL NOTIFICATIONS
// ============================================
// Deploy as Web App to receive POST requests from the portal
// Triggers: status change, assignment, completion, etc.

var NOTIFICATION_SECRET = 'dix-gmail-secret-2024';

/**
 * Handle POST requests from DIX Portal for sending notifications
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Check secret from body or query params
    var secret = data.secret || e.parameters.secret || '';
    if (secret !== NOTIFICATION_SECRET) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Unauthorized' })).setMimeType(ContentService.MimeType.JSON);
    }
    var to = data.to;
    var subject = data.subject;
    var htmlBody = data.html || '';

    if (!to || !subject) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Missing to or subject' })).setMimeType(ContentService.MimeType.JSON);
    }

    // Convert to array
    var recipients = Array.isArray(to) ? to : [to];
    var sentCount = 0;

    for (var i = 0; i < recipients.length; i++) {
      try {
        GmailApp.sendEmail(recipients[i], subject, '', { htmlBody: htmlBody, name: 'DIX Job Portal' });
        sentCount++;
      } catch (err) {
        Logger.log('Failed to send to ' + recipients[i] + ': ' + err.message);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, sent: sentCount })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return ContentService.createTextOutput(JSON.stringify({ error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}
