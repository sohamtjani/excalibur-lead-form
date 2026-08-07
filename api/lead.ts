import { z } from 'zod';

const helpOptions = [
  'I need a new website',
  'My current website is outdated',
  'I pay monthly but nothing gets updated',
  'My website is not bringing in leads',
  'I am not sure',
] as const;

function normalizePresenceLink(value: string) {
  const trimmed = value.trim();

  if (!trimmed || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

const leadSchema = z.object({
  businessName: z.string().min(2).max(160),
  contactName: z.string().min(2).max(160),
  email: z.string().email().max(320),
  phone: z.string().min(7).max(60),
  presenceLink: z.string().min(3).max(2_000).transform(normalizePresenceLink),
  helpNeeded: z.enum(helpOptions),
  referralCode: z.string().max(100).optional(),
  website: z.string().max(0),
});

type VercelRequest = {
  body: unknown;
  method?: string;
};

type VercelResponse = {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character];
  });
}

function textField(label: string, value: string) {
  return `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const parsed = leadSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: 'Please check the form and try again.' });
    return;
  }

  const { website, ...lead } = parsed.data;
  if (website) {
    response.status(400).json({ error: 'We could not send your request.' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const recipients = process.env.LEAD_NOTIFICATION_TO;

  if (!apiKey || !from || !recipients) {
    console.error('Missing Resend environment configuration.');
    response.status(500).json({ error: 'The form is not configured yet. Please try again later.' });
    return;
  }

  const recipientList = recipients
    .split(',')
    .map((recipient) => recipient.trim())
    .filter(Boolean);

  const emailHtml = [
    '<h1>New $350 website lead</h1>',
    textField('Business', lead.businessName),
    textField('Contact', lead.contactName),
    textField('Email', lead.email),
    textField('Phone', lead.phone),
    textField('Current presence', lead.presenceLink),
    textField('Situation', lead.helpNeeded),
    textField('Referral code', lead.referralCode || 'None'),
  ].join('');

  const emailText = [
    'New $350 website lead',
    `Business: ${lead.businessName}`,
    `Contact: ${lead.contactName}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone}`,
    `Current presence: ${lead.presenceLink}`,
    `Situation: ${lead.helpNeeded}`,
    `Referral code: ${lead.referralCode || 'None'}`,
  ].join('\n');

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'excalibur-lead-form/1.0',
      },
      body: JSON.stringify({
        from,
        to: recipientList,
        reply_to: lead.email,
        subject: `New $350 website lead — ${lead.businessName}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!resendResponse.ok) {
      console.error('Resend delivery failed:', await resendResponse.text());
      response.status(502).json({ error: 'We could not send your request. Please try again.' });
      return;
    }
  } catch (error) {
    console.error('Resend request failed:', error);
    response.status(502).json({ error: 'We could not send your request. Please try again.' });
    return;
  }

  response.status(201).json({ ok: true });
}
