import crypto from 'crypto';

export interface WebhookSignatureConfig {
  algorithm: 'hmac-sha256' | 'hmac-sha512';
  timestampHeader: string;
  signatureHeader: string;
  maxTimestampAge: number; // seconds
}

/**
 * Webhook Signature Validator
 * Handles HMAC signature validation for all webhooks (Aisensy, n8n, etc.)
 */
export class WebhookValidator {
  private config: WebhookSignatureConfig;

  constructor(config: Partial<WebhookSignatureConfig> = {}) {
    this.config = {
      algorithm: 'hmac-sha256',
      timestampHeader: 'x-webhook-timestamp',
      signatureHeader: 'x-webhook-signature',
      maxTimestampAge: 300, // 5 minutes
      ...config,
    };
  }

  /**
   * Verify Aisensy webhook signature
   * @param payload - Raw request body (as string)
   * @param signature - Signature from header
   * @param secret - Webhook secret key
   */
  verifyAisensyWebhook(payload: string, signature: string, secret: string): boolean {
    try {
      const hash = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
    } catch (error) {
      console.error('Aisensy webhook verification failed:', error);
      return false;
    }
  }

  /**
   * Verify n8n webhook signature
   * @param payload - Request body
   * @param signature - Signature from header
   * @param secret - Webhook secret
   */
  verifyN8nWebhook(payload: any, signature: string, secret: string): boolean {
    try {
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      return this.verifyAisensyWebhook(payloadString, signature, secret);
    } catch (error) {
      console.error('n8n webhook verification failed:', error);
      return false;
    }
  }

  /**
   * Verify signature with timestamp check
   * @param payload - Request body
   * @param signature - Signature header value
   * @param timestamp - Timestamp header value
   * @param secret - Webhook secret
   */
  verifyWithTimestamp(
    payload: string,
    signature: string,
    timestamp: string,
    secret: string
  ): { valid: boolean; error?: string } {
    // Check timestamp freshness
    try {
      const webhookTime = parseInt(timestamp, 10) * 1000; // Convert to ms
      const now = Date.now();
      const timeDiff = (now - webhookTime) / 1000; // Difference in seconds

      if (timeDiff < 0) {
        return { valid: false, error: 'Webhook timestamp is in the future' };
      }

      if (timeDiff > this.config.maxTimestampAge) {
        return { valid: false, error: 'Webhook timestamp is too old (possible replay attack)' };
      }

      // Verify signature
      const payloadWithTimestamp = `${timestamp}.${payload}`;
      const hash = crypto
        .createHmac(this.config.algorithm === 'hmac-sha256' ? 'sha256' : 'sha512', secret)
        .update(payloadWithTimestamp)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
      return { valid: isValid };
    } catch (error) {
      console.error('Timestamp verification error:', error);
      return { valid: false, error: 'Verification error' };
    }
  }

  /**
   * Log webhook event for audit trail
   */
  async logWebhookEvent(
    source: 'aisensy' | 'n8n' | 'twilio',
    payload: any,
    validated: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Log to console (can be extended to send to logging service)
      console.log(`[Webhook ${source}] ${validated ? '✓ Valid' : '✗ Invalid'}`, {
        timestamp: new Date().toISOString(),
        payload: typeof payload === 'string' ? payload.substring(0, 200) : JSON.stringify(payload).substring(0, 200),
        validated,
        metadata,
      });

      // Note: Database logging would go here
      // await logToDatabase({
      //   source,
      //   payload: JSON.stringify(payload),
      //   validated,
      //   metadata,
      //   createdAt: new Date(),
      // });
    } catch (error) {
      console.error('Error logging webhook event:', error);
    }
  }

  /**
   * Extract phone number from various webhook formats
   */
  extractPhoneNumber(payload: any): string | null {
    // Aisensy format
    if (payload?.phoneNumber) {
      return payload.phoneNumber;
    }
    // Twilio format
    if (payload?.From) {
      return payload.From;
    }
    // Generic WhatsApp format
    if (payload?.whatsapp_business_account_id && payload?.contacts?.[0]?.wa_id) {
      return '+' + payload.contacts[0].wa_id;
    }
    return null;
  }

  /**
   * Extract message content from various webhook formats
   */
  extractMessageContent(payload: any): string | null {
    // Aisensy format
    if (payload?.message) {
      return payload.message;
    }
    // Twilio format
    if (payload?.Body) {
      return payload.Body;
    }
    // Generic WhatsApp format
    if (payload?.messages?.[0]?.text?.body) {
      return payload.messages[0].text.body;
    }
    return null;
  }
}

// Export singleton instance
export const createWebhookValidator = (config?: Partial<WebhookSignatureConfig>) => {
  return new WebhookValidator(config);
};

export default WebhookValidator;
