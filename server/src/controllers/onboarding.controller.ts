import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import db from '../database/config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Onboarding Controller
 * Handles onboarding invitations and allowed contacts management
 */

/**
 * Get all allowed contacts
 * @access Admin, Project Manager, Supervisor
 */
export const getAllowedContacts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, method, search } = req.query;

    let query = db('allowed_contacts').whereNull('deleted_at');

    // Filter by status
    if (status) {
      query = query.where({ status });
    }

    // Filter by onboarding method
    if (method) {
      query = query.where({ method });
    }

    // Search by name, email, or phone
    if (search) {
      query = query.where((builder) => {
        builder
          .where('name', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`)
          .orWhere('phone', 'ilike', `%${search}%`);
      });
    }

    const contacts = await query
      .select('*')
      .orderBy('created_at', 'desc');

    res.status(200).json({
      status: 'success',
      data: { contacts },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create single allowed contact
 * @access Admin, Project Manager, Supervisor
 */
export const createAllowedContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, phone, method = 'app' } = req.body;

    // Validate required fields
    if (!name || (!email && !phone)) {
      throw new ApiError('Please provide name and at least email or phone', 400);
    }

    // Check if contact already exists
    let existingQuery = db('allowed_contacts').whereNull('deleted_at');

    if (email) {
      existingQuery = existingQuery.where({ email: email.toLowerCase() });
    } else if (phone) {
      existingQuery = existingQuery.where({ phone });
    }

    const existing = await existingQuery.first();

    if (existing) {
      throw new ApiError('Contact already exists', 400);
    }

    // Generate unique invite code
    const inviteCode = uuidv4();

    // Create contact
    const [contact] = await db('allowed_contacts')
      .insert({
        name,
        email: email ? email.toLowerCase() : null,
        phone: phone || null,
        method,
        status: 'pending',
        invite_code: inviteCode,
        created_by: req.user?.id,
      })
      .returning('*');

    res.status(201).json({
      status: 'success',
      data: { contact },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk create allowed contacts
 * @access Admin, Project Manager, Supervisor
 */
export const bulkCreateAllowedContacts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { contacts } = req.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      throw new ApiError('Please provide an array of contacts', 400);
    }

    const created: any[] = [];
    const errors: any[] = [];

    for (const contact of contacts) {
      try {
        const { name, email, phone, method = 'app' } = contact;

        // Validate
        if (!name || (!email && !phone)) {
          errors.push({
            contact,
            error: 'Missing name or contact info',
          });
          continue;
        }

        // Check if exists
        let existingQuery = db('allowed_contacts').whereNull('deleted_at');

        if (email) {
          existingQuery = existingQuery.where({ email: email.toLowerCase() });
        } else if (phone) {
          existingQuery = existingQuery.where({ phone });
        }

        const existing = await existingQuery.first();

        if (existing) {
          errors.push({
            contact,
            error: 'Contact already exists',
          });
          continue;
        }

        // Generate unique invite code
        const inviteCode = uuidv4();

        // Create
        const [newContact] = await db('allowed_contacts')
          .insert({
            name,
            email: email ? email.toLowerCase() : null,
            phone: phone || null,
            method,
            status: 'pending',
            invite_code: inviteCode,
            created_by: req.user?.id,
          })
          .returning('*');

        created.push(newContact);
      } catch (err: any) {
        errors.push({
          contact,
          error: err.message,
        });
      }
    }

    res.status(201).json({
      status: 'success',
      data: {
        created: created.length,
        failed: errors.length,
        contacts: created,
        errors,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send onboarding invite
 * @access Admin, Project Manager, Supervisor
 */
export const sendInvite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Get contact
    const contact = await db('allowed_contacts')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!contact) {
      throw new ApiError('Contact not found', 404);
    }

    // Generate invite link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${baseUrl}/onboarding?invite=${contact.invite_code}`;

    // Update contact status
    await db('allowed_contacts')
      .where({ id })
      .update({
        status: 'invited',
        invited_at: new Date(),
        invite_link: inviteLink,
        updated_at: new Date(),
      });

    // TODO: Send actual WhatsApp message or email
    // For now, just return the invite link
    // In production, integrate with WhatsApp Business API or SendGrid

    const message = contact.method === 'whatsapp'
      ? `Hi ${contact.name}! You've been invited to join ITSON FSM. Complete your onboarding here: ${inviteLink}`
      : `You've been invited to join ITSON FSM. Click here to get started: ${inviteLink}`;

    // Log the invite
    console.log(`📨 Invite sent to ${contact.email || contact.phone}`);
    console.log(`📱 Method: ${contact.method}`);
    console.log(`🔗 Link: ${inviteLink}`);

    res.status(200).json({
      status: 'success',
      data: {
        inviteLink,
        message,
        method: contact.method,
        recipient: contact.email || contact.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Broadcast invites to multiple contacts
 * @access Admin, Project Manager
 */
export const broadcastInvites = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { contactIds } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      throw new ApiError('Please provide an array of contact IDs', 400);
    }

    const sent: any[] = [];
    const failed: any[] = [];

    for (const id of contactIds) {
      try {
        // Get contact
        const contact = await db('allowed_contacts')
          .where({ id })
          .whereNull('deleted_at')
          .first();

        if (!contact) {
          failed.push({ id, error: 'Contact not found' });
          continue;
        }

        // Generate invite link
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const inviteLink = `${baseUrl}/onboarding?invite=${contact.invite_code}`;

        // Update contact status
        await db('allowed_contacts')
          .where({ id })
          .update({
            status: 'invited',
            invited_at: new Date(),
            invite_link: inviteLink,
            updated_at: new Date(),
          });

        sent.push({
          id,
          name: contact.name,
          recipient: contact.email || contact.phone,
          inviteLink,
        });

        console.log(`📨 Broadcast invite sent to ${contact.email || contact.phone}`);
      } catch (err: any) {
        failed.push({ id, error: err.message });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        sent: sent.length,
        failed: failed.length,
        invites: sent,
        errors: failed,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get invite by code
 * @access Public (for onboarding page)
 */
export const getInviteByCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.params;

    const contact = await db('allowed_contacts')
      .where({ invite_code: code })
      .whereNull('deleted_at')
      .select('id', 'name', 'email', 'phone', 'method', 'status', 'invite_link')
      .first();

    if (!contact) {
      throw new ApiError('Invalid invite code', 404);
    }

    if (contact.status === 'completed') {
      throw new ApiError('This invite has already been used', 400);
    }

    res.status(200).json({
      status: 'success',
      data: { contact },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete onboarding invite
 * @access Public (called after WhatsApp onboarding completes)
 */
export const completeInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.params;
    const { participantId } = req.body;

    // Update contact status
    const [contact] = await db('allowed_contacts')
      .where({ invite_code: code })
      .whereNull('deleted_at')
      .update({
        status: 'completed',
        completed_at: new Date(),
        participant_id: participantId,
        updated_at: new Date(),
      })
      .returning('*');

    if (!contact) {
      throw new ApiError('Invalid invite code', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { contact },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update allowed contact
 * @access Admin, Project Manager, Supervisor
 */
export const updateAllowedContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, email, phone, method, status } = req.body;

    // Build update object
    const updates: any = { updated_at: new Date() };
    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    if (phone !== undefined) updates.phone = phone;
    if (method) updates.method = method;
    if (status) updates.status = status;

    // Update contact
    const [contact] = await db('allowed_contacts')
      .where({ id })
      .whereNull('deleted_at')
      .update(updates)
      .returning('*');

    if (!contact) {
      throw new ApiError('Contact not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { contact },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete allowed contact
 * @access Admin, Project Manager
 */
export const deleteAllowedContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Soft delete
    await db('allowed_contacts')
      .where({ id })
      .update({
        deleted_at: new Date(),
      });

    res.status(200).json({
      status: 'success',
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
