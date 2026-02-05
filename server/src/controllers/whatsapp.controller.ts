import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import db from '../database/config';

/**
 * WhatsApp Controller
 * Handles WhatsApp Business API webhooks and message processing
 */

// Webhook verification for WhatsApp Business API
export const verifyWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Verify token matches the one set in WhatsApp Business API
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token_here';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      res.status(403).json({ error: 'Invalid verification token' });
    }
  } catch (error) {
    next(error);
  }
};

// Process incoming WhatsApp messages
export const processWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body;

    // Verify webhook signature (if using WhatsApp Business API)
    // TODO: Add signature verification for production

    // Acknowledge receipt immediately
    res.status(200).json({ status: 'received' });

    // Process webhook asynchronously
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];

      for (const entry of entries) {
        const changes = entry.changes || [];

        for (const change of changes) {
          if (change.field === 'messages') {
            const value = change.value;
            const messages = value.messages || [];

            for (const message of messages) {
              await handleIncomingMessage(message, value.metadata);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    next(error);
  }
};

// Handle incoming WhatsApp message
async function handleIncomingMessage(message: any, metadata: any) {
  try {
    const phoneNumber = message.from;
    const messageText = message.text?.body || '';
    const messageType = message.type || 'text';
    const whatsappMessageId = message.id;

    console.log(`📱 Received message from ${phoneNumber}: ${messageText}`);

    // Get or create session
    let session = await db('whatsapp_sessions')
      .where({ phone_number: phoneNumber })
      .whereNull('deleted_at')
      .first();

    if (!session) {
      // Create new session
      [session] = await db('whatsapp_sessions')
        .insert({
          phone_number: phoneNumber,
          status: 'active',
          stage: 'initial',
          session_data: {},
        })
        .returning('*');
    }

    // Log incoming message
    await db('whatsapp_messages').insert({
      session_id: session.id,
      direction: 'inbound',
      message: messageText,
      message_type: messageType,
      whatsapp_message_id: whatsappMessageId,
      delivered: true,
      read: true,
    });

    // Update last message timestamp
    await db('whatsapp_sessions')
      .where({ id: session.id })
      .update({
        last_message_at: new Date(),
        updated_at: new Date(),
      });

    // Process message based on current stage
    await processMessageByStage(session, messageText, messageType, message);
  } catch (error) {
    console.error('Error handling incoming message:', error);
    throw error;
  }
}

// Process message based on onboarding stage
async function processMessageByStage(
  session: any,
  messageText: string,
  messageType: string,
  rawMessage: any
) {
  const sessionData = session.session_data || {};

  switch (session.stage) {
    case 'initial':
      await sendMessage(
        session.phone_number,
        'Welcome to ITSON FSM! 👋\n\nLet\'s get you registered. What is your full name?'
      );
      await updateSessionStage(session.id, 'waiting_name', sessionData);
      break;

    case 'waiting_name':
      sessionData.full_name = messageText.trim();
      await sendMessage(
        session.phone_number,
        `Thanks ${sessionData.full_name}! 📝\n\nPlease provide your South African ID number (13 digits).`
      );
      await updateSessionStage(session.id, 'waiting_sa_id', sessionData);
      break;

    case 'waiting_sa_id':
      if (!/^\d{13}$/.test(messageText.trim())) {
        await sendMessage(
          session.phone_number,
          '❌ Invalid ID number. Please provide a valid 13-digit South African ID number.'
        );
        return;
      }
      sessionData.sa_id_number = messageText.trim();
      await sendMessage(
        session.phone_number,
        'Great! Now, what is your date of birth? (Format: YYYY-MM-DD)'
      );
      await updateSessionStage(session.id, 'waiting_dob', sessionData);
      break;

    case 'waiting_dob':
      // Basic date validation
      if (!/^\d{4}-\d{2}-\d{2}$/.test(messageText.trim())) {
        await sendMessage(
          session.phone_number,
          '❌ Invalid date format. Please use YYYY-MM-DD format (e.g., 1990-01-15).'
        );
        return;
      }
      sessionData.date_of_birth = messageText.trim();
      await sendMessage(
        session.phone_number,
        'What is your gender? (Male/Female/Other)'
      );
      await updateSessionStage(session.id, 'waiting_gender', sessionData);
      break;

    case 'waiting_gender':
      sessionData.gender = messageText.trim();
      await sendMessage(
        session.phone_number,
        'Please provide your full residential address.'
      );
      await updateSessionStage(session.id, 'waiting_address', sessionData);
      break;

    case 'waiting_address':
      sessionData.address = messageText.trim();
      await sendMessage(
        session.phone_number,
        'Emergency contact information:\n\nWhat is your emergency contact\'s full name?'
      );
      await updateSessionStage(session.id, 'waiting_emergency_contact', sessionData);
      break;

    case 'waiting_emergency_contact':
      sessionData.emergency_contact_name = messageText.trim();
      await sendMessage(
        session.phone_number,
        'What is their phone number?'
      );
      await updateSessionStage(session.id, 'waiting_emergency_phone', sessionData);
      break;

    case 'waiting_emergency_phone':
      sessionData.emergency_contact_phone = messageText.trim();
      await sendMessage(
        session.phone_number,
        'What is their relationship to you? (e.g., Spouse, Parent, Sibling)'
      );
      await updateSessionStage(session.id, 'waiting_emergency_relationship', sessionData);
      break;

    case 'waiting_emergency_relationship':
      sessionData.emergency_contact_relationship = messageText.trim();
      await sendMessage(
        session.phone_number,
        '📸 Please send a clear photo of yourself for biometric registration.'
      );
      await updateSessionStage(session.id, 'waiting_photo', sessionData);
      break;

    case 'waiting_photo':
      if (messageType === 'image') {
        sessionData.photo_url = rawMessage.image?.id || rawMessage.image?.link;
        await sendMessage(
          session.phone_number,
          '✅ Photo received!\n\n📄 Now please send a photo of your SA ID document (both sides if possible).'
        );
        await updateSessionStage(session.id, 'waiting_sa_id_document', sessionData);
      } else {
        await sendMessage(
          session.phone_number,
          '❌ Please send an image file for your photo.'
        );
      }
      break;

    case 'waiting_sa_id_document':
      if (messageType === 'image' || messageType === 'document') {
        sessionData.sa_id_document_url = rawMessage.image?.id || rawMessage.document?.id;
        await sendMessage(
          session.phone_number,
          '✅ ID document received!\n\n🏠 Please send proof of residence (utility bill, bank statement, etc.).'
        );
        await updateSessionStage(session.id, 'waiting_proof_of_residence', sessionData);
      } else {
        await sendMessage(
          session.phone_number,
          '❌ Please send an image or document file.'
        );
      }
      break;

    case 'waiting_proof_of_residence':
      if (messageType === 'image' || messageType === 'document') {
        sessionData.proof_of_residence_url = rawMessage.image?.id || rawMessage.document?.id;
        await sendMessage(
          session.phone_number,
          '📋 POPIA Consent:\n\nWe need your consent to process your personal information in accordance with POPIA (Protection of Personal Information Act).\n\nReply "I CONSENT" to agree.'
        );
        await updateSessionStage(session.id, 'waiting_popia_consent', sessionData);
      } else {
        await sendMessage(
          session.phone_number,
          '❌ Please send an image or document file.'
        );
      }
      break;

    case 'waiting_popia_consent':
      if (messageText.toUpperCase().includes('CONSENT')) {
        sessionData.popia_consent = true;
        sessionData.popia_consent_date = new Date().toISOString();
        await sendMessage(
          session.phone_number,
          '📜 Code of Conduct:\n\nPlease review and agree to our Code of Conduct.\n\nReply "I AGREE" to accept the terms.'
        );
        await updateSessionStage(session.id, 'waiting_code_of_conduct', sessionData);
      } else {
        await sendMessage(
          session.phone_number,
          '❌ You must consent to POPIA to continue. Reply "I CONSENT" to proceed.'
        );
      }
      break;

    case 'waiting_code_of_conduct':
      if (messageText.toUpperCase().includes('AGREE')) {
        sessionData.code_of_conduct_signed = true;

        // Create participant record
        await createParticipant(session.id, sessionData);

        await sendMessage(
          session.phone_number,
          '🎉 Registration Complete!\n\nYour profile has been created successfully. You will receive further instructions from your supervisor.\n\nThank you for joining ITSON FSM!'
        );

        await updateSessionStage(session.id, 'completed', sessionData, 'completed');
      } else {
        await sendMessage(
          session.phone_number,
          '❌ You must agree to the Code of Conduct to continue. Reply "I AGREE" to proceed.'
        );
      }
      break;

    default:
      await sendMessage(
        session.phone_number,
        'Your registration is already complete. If you need assistance, please contact your supervisor.'
      );
      break;
  }
}

// Create participant from session data
async function createParticipant(sessionId: string, sessionData: any) {
  try {
    const [participant] = await db('participants')
      .insert({
        full_name: sessionData.full_name,
        sa_id_number: sessionData.sa_id_number,
        date_of_birth: sessionData.date_of_birth,
        gender: sessionData.gender,
        address: sessionData.address,
        phone: sessionData.phone_number,
        emergency_contact_name: sessionData.emergency_contact_name,
        emergency_contact_phone: sessionData.emergency_contact_phone,
        emergency_contact_relationship: sessionData.emergency_contact_relationship,
        popia_consent: sessionData.popia_consent,
        popia_consent_date: sessionData.popia_consent_date,
        code_of_conduct_signed: sessionData.code_of_conduct_signed,
        status: 'pending', // Pending supervisor approval
        documents: {
          photo: sessionData.photo_url,
          sa_id: sessionData.sa_id_document_url,
          proof_of_residence: sessionData.proof_of_residence_url,
        },
      })
      .returning('*');

    // Link participant to session
    await db('whatsapp_sessions')
      .where({ id: sessionId })
      .update({ participant_id: participant.id });

    console.log(`✅ Created participant: ${participant.id}`);
    return participant;
  } catch (error) {
    console.error('Error creating participant:', error);
    throw error;
  }
}

// Update session stage
async function updateSessionStage(
  sessionId: string,
  stage: string,
  sessionData: any,
  status?: string
) {
  const updates: any = {
    stage,
    session_data: sessionData,
    updated_at: new Date(),
  };

  if (status) {
    updates.status = status;
  }

  await db('whatsapp_sessions').where({ id: sessionId }).update(updates);
}

// Send WhatsApp message
async function sendMessage(phoneNumber: string, message: string) {
  try {
    // Log outgoing message
    const session = await db('whatsapp_sessions')
      .where({ phone_number: phoneNumber })
      .first();

    if (session) {
      await db('whatsapp_messages').insert({
        session_id: session.id,
        direction: 'outbound',
        message,
        message_type: 'text',
        delivered: true, // Will be updated by delivery webhook
      });
    }

    // TODO: Integrate with actual WhatsApp Business API
    // For now, just log the message
    console.log(`📤 Sending to ${phoneNumber}: ${message}`);

    // Example: Twilio WhatsApp integration
    /*
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);

    await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phoneNumber}`,
    });
    */

    // Example: WhatsApp Business API
    /*
    const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
    const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

    await fetch(`${WHATSAPP_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: message },
      }),
    });
    */
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Get all WhatsApp sessions (for admin dashboard)
export const getSessions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, stage, limit = 50, offset = 0 } = req.query;

    let query = db('whatsapp_sessions')
      .whereNull('deleted_at')
      .orderBy('last_message_at', 'desc')
      .limit(Number(limit))
      .offset(Number(offset));

    if (status) {
      query = query.where({ status: status as string });
    }

    if (stage) {
      query = query.where({ stage: stage as string });
    }

    const sessions = await query;

    res.status(200).json({
      status: 'success',
      results: sessions.length,
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
};

// Get session details with message history
export const getSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const session = await db('whatsapp_sessions')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!session) {
      return next(new ApiError('Session not found', 404));
    }

    const messages = await db('whatsapp_messages')
      .where({ session_id: id })
      .orderBy('created_at', 'asc');

    res.status(200).json({
      status: 'success',
      data: {
        session,
        messages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Manual send message (for testing or admin override)
export const sendManualMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return next(new ApiError('Phone number and message are required', 400));
    }

    await sendMessage(phoneNumber, message);

    res.status(200).json({
      status: 'success',
      message: 'Message sent successfully',
    });
  } catch (error) {
    next(error);
  }
};
