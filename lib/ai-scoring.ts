// AI Lead Scoring Service
// Scores leads based on: email domain, company, activity, engagement patterns, etc.

interface LeadData {
  email?: string;
  name?: string;
  phone?: string;
  company?: string;
  source?: string;
  notes?: string;
  conversationCount?: number;
  lastActivityDays?: number;
}

export function calculateLeadScore(lead: LeadData): {
  score: number;
  factors: Record<string, number>;
  recommendation: string;
} {
  const factors: Record<string, number> = {};
  let score = 20; // Base score

  // Email domain quality (popular business domains get higher score)
  if (lead.email) {
    const domain = lead.email.split('@')[1]?.toLowerCase() || '';
    const businessDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const freeEmailDomains = [...businessDomains];

    if (!freeEmailDomains.includes(domain)) {
      factors.emailDomain = 15; // Company email = higher score
      score += 15;
    } else {
      factors.emailDomain = 0;
    }
  }

  // Company information
  if (lead.company && lead.company.length > 2) {
    factors.company = 20;
    score += 20;
  } else {
    factors.company = 0;
  }

  // Phone verification
  if (lead.phone) {
    factors.phone = 10;
    score += 10;
  } else {
    factors.phone = 0;
  }

  // Source quality
  if (lead.source) {
    const sourceScores: Record<string, number> = {
      api: 25,
      form: 20,
      email: 15,
      whatsapp: 15,
      manual: 5,
    };
    factors.source = sourceScores[lead.source] || 0;
    score += factors.source;
  }

  // Engagement (conversation count)
  if (lead.conversationCount) {
    const engagementScore = Math.min(lead.conversationCount * 5, 15);
    factors.engagement = engagementScore;
    score += engagementScore;
  } else {
    factors.engagement = 0;
  }

  // Recency (last activity)
  if (lead.lastActivityDays !== undefined) {
    if (lead.lastActivityDays <= 3) {
      factors.recency = 15;
      score += 15;
    } else if (lead.lastActivityDays <= 7) {
      factors.recency = 10;
      score += 10;
    } else if (lead.lastActivityDays <= 30) {
      factors.recency = 5;
      score += 5;
    } else {
      factors.recency = 0;
    }
  }

  // Name quality
  if (lead.name && lead.name.split(' ').length >= 2) {
    factors.nameQuality = 5;
    score += 5;
  } else {
    factors.nameQuality = 0;
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Recommendation
  let recommendation = 'New';
  if (score >= 70) {
    recommendation = 'Hot - Contact immediately';
  } else if (score >= 50) {
    recommendation = 'Warm - Follow up soon';
  } else if (score >= 30) {
    recommendation = 'Cold - Add to nurture';
  }

  return { score, factors, recommendation };
}

export function predictNextAction(
  lead: LeadData,
  score: number
): {
  action: string;
  urgency: 'high' | 'medium' | 'low';
  suggestedMessage?: string;
} {
  const urgency = score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';

  let action = 'Review';
  let suggestedMessage: string | undefined;

  if (score >= 70) {
    action = 'Contact Now';
    suggestedMessage = `Hi ${lead.name}, I noticed your interest in our services. Would you like to schedule a quick call to discuss how we can help?`;
  } else if (score >= 50) {
    action = 'Schedule Follow-up';
    suggestedMessage = `Hi ${lead.name}, thanks for reaching out! Let me share more details about our solution.`;
  } else if (score >= 30) {
    action = 'Add to Nurture Campaign';
    suggestedMessage = `Hi ${lead.name}, welcome! Here are some resources that might interest you.`;
  }

  return { action, urgency, suggestedMessage };
}

export async function scoreLeadsInBatch(leads: LeadData[]) {
  const scoredLeads = leads.map((lead) => {
    const { score, factors, recommendation } = calculateLeadScore(lead);
    const { action, urgency, suggestedMessage } = predictNextAction(lead, score);

    return {
      ...lead,
      score,
      factors,
      recommendation,
      action,
      urgency,
      suggestedMessage,
    };
  });

  return scoredLeads.sort((a, b) => b.score - a.score);
}
