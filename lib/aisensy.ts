import crypto from 'crypto';

// Aisensy API Response Types
export interface AisensyMessageResponse {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  error?: string;
}

export interface AisensyWebhookPayload {
  phoneNumber: string;
  message: string;
  messageId: string;
  timestamp: string;
  status?: string;
}

/**
 * Aisensy SDK Wrapper
 * Handles all Aisensy API interactions for WhatsApp messaging
 */
class AisensySDK {
  private apiKey: string;
  private apiUrl: string;
  private webhookSecret: string;

  constructor(apiKey: string, apiUrl: string, webhookSecret: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.webhookSecret = webhookSecret;
  }

  /**
   * Send WhatsApp message via Aisensy
   * @param phoneNumber - Recipient phone number (E.164 format: +1234567890)
   * @param message - Message content
   * @param options - Optional: templateId, mediaUrl, etc.
   */
  async sendWhatsAppMessage(
    phoneNumber: string,
    message: string,
    options?: {
      templateId?: string;
      mediaUrl?: string;
      buttons?: { text: string; id: string }[];
    }
  ): Promise<AisensyMessageResponse> {
    try {
      if (!this.validatePhoneNumber(phoneNumber)) {
        throw new Error(`Invalid phone number format: ${phoneNumber}`);
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.normalizePhoneNumber(phoneNumber),
        type: options?.templateId ? 'template' : 'text',
        text: options?.templateId ? undefined : { body: message },
        template: options?.templateId
          ? {
              name: options.templateId,
              language: { code: 'en_US' },
              components: [
                {
                  type: 'body',
                  parameters: [{ type: 'text', text: message }],
                },
              ],
            }
          : undefined,
      };

      const response = await fetch(`${this.apiUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Aisensy API error:', error);
        throw new Error(
          `Aisensy API error: ${error.message || response.statusText}`
        );
      }

      const data = await response.json();
      return {
        messageId: data.messages?.[0]?.id || 'unknown',
        status: 'sent',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        messageId: '',
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reply to customer message
   * @param phoneNumber - Customer phone number
   * @param message - Reply message
   */
  async replyToCustomer(phoneNumber: string, message: string): Promise<AisensyMessageResponse> {
    return this.sendWhatsAppMessage(phoneNumber, message);
  }

  /**
   * Get message delivery status
   * @param messageId - Aisensy message ID
   */
  async getMessageStatus(messageId: string): Promise<AisensyMessageResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/v1/messages/${messageId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Aisensy API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        messageId: data.id,
        status: (data.status as any) || 'unknown',
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting message status:', error);
      return {
        messageId,
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate Aisensy webhook signature (HMAC-SHA256)
   * @param payload - Request body
   * @param signature - X-Webhook-Signature header
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }

  /**
   * Validate phone number format (E.164)
   */
  private validatePhoneNumber(phoneNumber: string): boolean {
    // E.164 format: +[1-9]{1}[0-9]{1,14}
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Normalize phone number to E.164 format
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except +
    let normalized = phoneNumber.replace(/[^\d+]/g, '');

    // If starts with country code but no +, add it
    if (!normalized.startsWith('+') && !normalized.startsWith('00')) {
      normalized = '+' + normalized;
    }

    // Replace 00 with +
    if (normalized.startsWith('00')) {
      normalized = '+' + normalized.slice(2);
    }

    return normalized;
  }
}

// Export singleton instance
export const createAisensySDK = (apiKey: string, apiUrl: string, webhookSecret: string) => {
  return new AisensySDK(apiKey, apiUrl, webhookSecret);
};

export default AisensySDK;
