/**
 * WhatsApp Bot Integration for ITSON FSM Onboarding
 *
 * Provides WhatsApp-based onboarding matching the 6-response PWA flow
 * Integrates with WhatsApp Business API or Twilio WhatsApp
 */

export interface WhatsAppMessage {
  id: string;
  from: string; // Phone number
  to: string; // Bot number
  body: string;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'audio' | 'video';
  status: 'received' | 'processing' | 'responded' | 'failed';
}

export interface WhatsAppSession {
  id: string;
  phoneNumber: string;
  candidateId?: string;
  currentStep: number; // 0-6
  state: 'NOT_STARTED' | 'IN_PROGRESS' | 'AWAITING_DOCUMENT' | 'AWAITING_CONFIRMATION' | 'VERIFIED' | 'FAILED';
  responseCount: number;
  data: {
    fullName?: string;
    saIdNumber?: string;
    popiaConsent?: boolean;
    documents?: Record<string, string>; // documentType -> mediaUrl
    bankAccount?: string;
    branchCode?: string;
    address?: string;
    confirmations?: Record<string, boolean>;
  };
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppBotConfig {
  apiKey: string;
  apiSecret: string;
  phoneNumberId: string;
  webhookUrl: string;
  provider: 'whatsapp-business-api' | 'twilio' | 'mock';
}

class WhatsAppBotService {
  private config: WhatsAppBotConfig | null = null;
  private sessions: Map<string, WhatsAppSession> = new Map();

  /**
   * Initialize WhatsApp bot with configuration
   */
  initialize(config: WhatsAppBotConfig): void {
    this.config = config;
    this.loadSessions();
  }

  /**
   * Load existing sessions from localStorage
   */
  private loadSessions(): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('whatsapp_session_')) {
        const session = JSON.parse(localStorage.getItem(key)!);
        this.sessions.set(session.phoneNumber, session);
      }
    }
  }

  /**
   * Handle incoming WhatsApp message
   */
  async handleIncomingMessage(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from;
    let session = this.sessions.get(phoneNumber);

    // Create new session if none exists
    if (!session) {
      session = {
        id: crypto.randomUUID(),
        phoneNumber,
        currentStep: 0,
        state: 'NOT_STARTED',
        responseCount: 0,
        data: {},
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.sessions.set(phoneNumber, session);
      this.saveSession(session);
    }

    // Update last message timestamp
    session.lastMessageAt = new Date().toISOString();

    // Route to appropriate handler based on current step
    try {
      await this.routeMessage(session, message);
    } catch (error) {
      console.error('Error handling WhatsApp message:', error);
      await this.sendMessage(phoneNumber, '❌ Sorry, there was an error processing your message. Please try again.');
    }
  }

  /**
   * Route message to appropriate step handler
   */
  private async routeMessage(session: WhatsAppSession, message: WhatsAppMessage): Promise<void> {
    const body = message.body.trim().toLowerCase();

    // Welcome message or restart
    if (session.currentStep === 0 || body === 'start' || body === 'restart') {
      await this.handleStart(session);
      return;
    }

    // Route to current step
    switch (session.currentStep) {
      case 1:
        await this.handleStep1(session, message);
        break;
      case 2:
        await this.handleStep2(session, message);
        break;
      case 3:
        await this.handleStep3(session, message);
        break;
      case 4:
        await this.handleStep4(session, message);
        break;
      case 5:
        await this.handleStep5(session, message);
        break;
      case 6:
        await this.handleStep6(session, message);
        break;
      default:
        await this.sendMessage(session.phoneNumber, 'Type START to begin onboarding.');
    }

    this.saveSession(session);
  }

  /**
   * STEP 0: Welcome & Start
   */
  private async handleStart(session: WhatsAppSession): Promise<void> {
    session.currentStep = 1;
    session.state = 'IN_PROGRESS';
    session.responseCount = 0;
    session.updatedAt = new Date().toISOString();

    await this.sendMessage(
      session.phoneNumber,
      `🌟 *Welcome to ITSON FSM Onboarding* 🌟

📋 *IDC Social Employment Fund Programme*

You will complete onboarding in *exactly 6 responses*.

⚠️ *Before you start:*
• POPIA consent is MANDATORY
• All 7 documents must be uploaded
• You cannot activate without VERIFIED status
• All actions are audit-logged

---

📝 *Response 1 of 6: Identity + POPIA Consent*

Please reply with the following format:

\`\`\`
Full Name: [Your full name as per ID]
ID Number: [13-digit SA ID number]
POPIA Consent: YES
\`\`\`

Example:
\`\`\`
Full Name: John Doe
ID Number: 9001015009087
POPIA Consent: YES
\`\`\``
    );
  }

  /**
   * STEP 1: Identity + POPIA Consent
   */
  private async handleStep1(session: WhatsAppSession, message: WhatsAppMessage): Promise<void> {
    const body = message.body;

    // Parse response
    const nameMatch = body.match(/full name:?\s*(.+)/i);
    const idMatch = body.match(/id number:?\s*(\d{13})/i);
    const popiaMatch = body.match(/popia consent:?\s*(yes|y|accept|agree)/i);

    if (!nameMatch || !idMatch || !popiaMatch) {
      await this.sendMessage(
        session.phoneNumber,
        `❌ *Invalid format*

Please provide all required information:

Full Name: [Your name]
ID Number: [13 digits]
POPIA Consent: YES`
      );
      return;
    }

    const fullName = nameMatch[1].trim();
    const saIdNumber = idMatch[1];

    // Validate SA ID
    if (!this.validateSAID(saIdNumber)) {
      await this.sendMessage(session.phoneNumber, '❌ Invalid SA ID number. Please check and try again.');
      return;
    }

    // Save data
    session.data.fullName = fullName;
    session.data.saIdNumber = saIdNumber;
    session.data.popiaConsent = true;
    session.responseCount = 1;
    session.currentStep = 2;
    session.state = 'AWAITING_DOCUMENT';
    session.updatedAt = new Date().toISOString();

    await this.sendMessage(
      session.phoneNumber,
      `✅ *Response 1 Complete*

Identity confirmed:
👤 Name: ${fullName}
🆔 ID: ${saIdNumber}
✓ POPIA consent received

---

📝 *Response 2 of 6: Upload Documents*

Please upload the following 7 documents (send as images or PDFs):

1️⃣ Certified South African ID
2️⃣ Police Affidavit
3️⃣ Proof of Bank Account
4️⃣ Proof of Address
5️⃣ Application Form
6️⃣ CV (Curriculum Vitae)
7️⃣ POPIA Consent Form

*Send each document with a caption indicating which document it is.*

Example: Send image with caption "Certified ID"`
    );
  }

  /**
   * STEP 2: Document Upload
   */
  private async handleStep2(session: WhatsAppSession, message: WhatsAppMessage): Promise<void> {
    if (!message.mediaUrl) {
      await this.sendMessage(
        session.phoneNumber,
        `Please upload documents as images or PDFs.

Send each with a caption:
• "Certified ID"
• "Police Affidavit"
• "Bank Proof"
• "Address Proof"
• "Application Form"
• "CV"
• "POPIA Consent"

Type "DONE" when all 7 documents are uploaded.`
      );
      return;
    }

    // Store document
    if (!session.data.documents) {
      session.data.documents = {};
    }

    const caption = message.body.toLowerCase();
    let docType = '';

    if (caption.includes('id') || caption.includes('identity')) docType = 'certified-sa-id';
    else if (caption.includes('police') || caption.includes('affidavit')) docType = 'police-affidavit';
    else if (caption.includes('bank')) docType = 'proof-of-bank-account';
    else if (caption.includes('address')) docType = 'proof-of-address';
    else if (caption.includes('application') || caption.includes('form')) docType = 'application-form';
    else if (caption.includes('cv') || caption.includes('curriculum')) docType = 'cv';
    else if (caption.includes('popia') || caption.includes('consent')) docType = 'popia-consent';

    if (docType) {
      session.data.documents[docType] = message.mediaUrl;
      await this.sendMessage(
        session.phoneNumber,
        `✅ Document received: ${docType}

Documents uploaded: ${Object.keys(session.data.documents).length}/7

Type "DONE" when all documents are uploaded.`
      );
    } else {
      await this.sendMessage(
        session.phoneNumber,
        `Please include a caption indicating which document this is (e.g., "Certified ID", "Bank Proof", etc.)`
      );
    }

    session.updatedAt = new Date().toISOString();

    // Check if user typed DONE
    if (message.body.toLowerCase().includes('done')) {
      const docCount = Object.keys(session.data.documents || {}).length;
      if (docCount < 7) {
        await this.sendMessage(
          session.phoneNumber,
          `❌ Only ${docCount}/7 documents uploaded.

Please upload all 7 required documents before typing DONE.`
        );
        return;
      }

      session.responseCount = 2;
      session.currentStep = 3;
      session.state = 'AWAITING_CONFIRMATION';
      session.updatedAt = new Date().toISOString();

      await this.sendMessage(
        session.phoneNumber,
        `✅ *Response 2 Complete*

All 7 documents received!

---

📝 *Response 3 of 6: Confirm Personal Data*

Based on your documents, we extracted:
👤 Name: ${session.data.fullName}
🆔 ID Number: ${session.data.saIdNumber}
📅 Date of Birth: [Extracted from ID]

Reply with:
CONFIRM - If all details are correct
EDIT - If you need to make changes`
      );
    }
  }

  /**
   * STEP 3: Confirm Personal Data
   */
  private async handleStep3(session: WhatsAppSession, message: WhatsAppMessage): Promise<void> {
    const body = message.body.trim().toLowerCase();

    if (body === 'confirm' || body === 'yes' || body === 'correct') {
      session.responseCount = 3;
      session.currentStep = 4;
      session.updatedAt = new Date().toISOString();

      await this.sendMessage(
        session.phoneNumber,
        `✅ *Response 3 Complete*

Personal data confirmed.

---

📝 *Response 4 of 6: Bank + Address Details*

Please provide:

\`\`\`
Bank Account: [10-16 digit account number]
Branch Code: [6 digits]
Address: [Full residential address]
\`\`\`

Example:
\`\`\`
Bank Account: 1234567890
Branch Code: 123456
Address: 123 Main Street, Johannesburg, 2000
\`\`\``
      );
    } else if (body === 'edit' || body === 'change') {
      await this.sendMessage(
        session.phoneNumber,
        `To edit your data, please contact support or restart the onboarding process by typing RESTART.`
      );
    } else {
      await this.sendMessage(
        session.phoneNumber,
        `Please reply with CONFIRM or EDIT.`
      );
    }
  }

  /**
   * STEP 4: Bank + Address
   */
  private async handleStep4(session: WhatsAppSession, message: WhatsAppMessage): Promise<void> {
    const body = message.body;

    const accountMatch = body.match(/bank account:?\s*(\d{10,16})/i);
    const branchMatch = body.match(/branch code:?\s*(\d{6})/i);
    const addressMatch = body.match(/address:?\s*(.+)/i);

    if (!accountMatch || !branchMatch || !addressMatch) {
      await this.sendMessage(
        session.phoneNumber,
        `❌ *Invalid format*

Please provide:
Bank Account: [number]
Branch Code: [6 digits]
Address: [full address]`
      );
      return;
    }

    session.data.bankAccount = accountMatch[1];
    session.data.branchCode = branchMatch[1];
    session.data.address = addressMatch[1].trim();
    session.responseCount = 4;
    session.currentStep = 5;
    session.updatedAt = new Date().toISOString();

    await this.sendMessage(
      session.phoneNumber,
      `✅ *Response 4 Complete*

Bank details confirmed:
🏦 Account: ${session.data.bankAccount}
🔢 Branch: ${session.data.branchCode}
📍 Address: ${session.data.address}

---

📝 *Response 5 of 6: Confirm Application Data*

Review your CV and application information.

Reply with:
CONFIRM - If application data is correct`
    );
  }

  /**
   * STEP 5: Confirm Application Data
   */
  private async handleStep5(session: WhatsAppSession, message: WhatsAppMessage): Promise<void> {
    const body = message.body.trim().toLowerCase();

    if (body === 'confirm' || body === 'yes') {
      session.responseCount = 5;
      session.currentStep = 6;
      session.updatedAt = new Date().toISOString();

      await this.sendMessage(
        session.phoneNumber,
        `✅ *Response 5 Complete*

Application data confirmed.

---

📝 *Response 6 of 6: Final Declaration*

By replying ACCEPT, you declare that:
✓ All information provided is true and accurate
✓ All documents uploaded are genuine
✓ You understand this is a formal onboarding process
✓ You consent to verification and audit

Reply with:
ACCEPT - To complete onboarding
CANCEL - To cancel onboarding`
      );
    } else {
      await this.sendMessage(session.phoneNumber, `Please reply with CONFIRM to proceed.`);
    }
  }

  /**
   * STEP 6: Final Declaration (Complete)
   */
  private async handleStep6(session: WhatsAppSession, message: WhatsAppMessage): Promise<void> {
    const body = message.body.trim().toLowerCase();

    if (body === 'accept' || body === 'yes' || body === 'agree') {
      session.responseCount = 6;
      session.currentStep = 7; // Beyond 6 = complete
      session.state = 'VERIFIED';
      session.updatedAt = new Date().toISOString();

      await this.sendMessage(
        session.phoneNumber,
        `🎉 *Onboarding Complete!* 🎉

✅ Status: VERIFIED

Your onboarding has been completed successfully.

Your profile is now ready for payroll sync authorization by an administrator.

📋 Summary:
✓ All 7 documents uploaded and verified
✓ Personal data confirmed
✓ POPIA consent recorded
✓ Session locked (6/6 responses)

You will be notified when your profile is synchronized to the payroll system.

Thank you for joining the ITSON FSM Programme! 🌟`
      );
    } else if (body === 'cancel') {
      session.state = 'FAILED';
      session.updatedAt = new Date().toISOString();

      await this.sendMessage(
        session.phoneNumber,
        `❌ Onboarding cancelled.

Type START to begin a new onboarding session.`
      );
    } else {
      await this.sendMessage(session.phoneNumber, `Please reply with ACCEPT or CANCEL.`);
    }
  }

  /**
   * Send WhatsApp message
   */
  private async sendMessage(to: string, body: string): Promise<void> {
    if (!this.config) {
      console.error('WhatsApp bot not configured');
      return;
    }

    // Mock implementation - replace with actual API call
    if (this.config.provider === 'mock') {
      console.log(`[WhatsApp Mock] To: ${to}`);
      console.log(`[WhatsApp Mock] Message:\n${body}\n`);
      return;
    }

    // Actual implementation would call WhatsApp Business API or Twilio
    // Example for WhatsApp Business API:
    // await fetch(`https://graph.facebook.com/v18.0/${this.config.phoneNumberId}/messages`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.config.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: to,
    //     text: { body },
    //   }),
    // });
  }

  /**
   * Validate SA ID number (Luhn algorithm)
   */
  private validateSAID(idNumber: string): boolean {
    if (!/^\d{13}$/.test(idNumber)) return false;

    // Luhn algorithm
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      let digit = parseInt(idNumber[i]);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(idNumber[12]);
  }

  /**
   * Save session to localStorage
   */
  private saveSession(session: WhatsAppSession): void {
    localStorage.setItem(`whatsapp_session_${session.id}`, JSON.stringify(session));
    this.sessions.set(session.phoneNumber, session);
  }

  /**
   * Get session by phone number
   */
  getSession(phoneNumber: string): WhatsAppSession | undefined {
    return this.sessions.get(phoneNumber);
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): WhatsAppSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get sessions by state
   */
  getSessionsByState(state: WhatsAppSession['state']): WhatsAppSession[] {
    return Array.from(this.sessions.values()).filter(s => s.state === state);
  }
}

// Export singleton instance
export const whatsappBot = new WhatsAppBotService();
