import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, CircleDollarSign, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { supabase, supabaseConfigError } from './lib/supabase';
import excaliburLogo from './assets/excalibur-logo.png';

const helpOptions = [
  'I need a new website',
  'My current website is outdated',
  'I pay monthly but nothing gets updated',
  'My website is not bringing in leads',
  'I am not sure',
] as const;

function normalizePresenceLink(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

const leadFormSchema = z.object({
  businessName: z.string().min(2, 'Enter the business name.'),
  contactName: z.string().min(2, 'Enter the contact name.'),
  email: z.string().email('Use a valid email address.'),
  phone: z.string().min(7, 'Enter a valid phone number.'),
  presenceLink: z
    .string()
    .min(3, 'Add your website, Google Business Profile, or Facebook page link.')
    .transform(normalizePresenceLink),
  helpNeeded: z.string().refine((value) => helpOptions.includes(value as (typeof helpOptions)[number]), {
    message: 'Select what you most need help with.',
  }),
  referralCode: z.string().optional(),
  website: z.string().max(0, 'Leave this field blank.'),
});

function App() {
  const queryReferralCode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('ref') || params.get('code') || '').toUpperCase();
  }, []);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(supabaseConfigError);
  const [form, setForm] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    presenceLink: '',
    helpNeeded: '',
    referralCode: queryReferralCode,
    website: '',
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (!supabase) {
      setMessage('This page is missing its Supabase connection.');
      return;
    }

    const lastSubmission = Number(window.localStorage.getItem('excalibur_public_lead_form_last_submission') || '0');
    if (Date.now() - lastSubmission < 60_000) {
      setMessage('Please wait a minute before sending another request.');
      return;
    }

    setLoading(true);

    try {
      const parsed = leadFormSchema.parse(form);

      const { error } = await supabase.from('leads').insert({
        business_name: parsed.businessName,
        contact_name: parsed.contactName,
        contact_info: {
          email: parsed.email,
          phone: parsed.phone,
          presence_link: parsed.presenceLink,
          help_needed: parsed.helpNeeded,
        },
        notes: `Audit focus: ${parsed.helpNeeded}\nCurrent link: ${parsed.presenceLink}`,
        submitted_referral_code: parsed.referralCode || null,
      });

      if (error) {
        throw error;
      }

      window.localStorage.setItem('excalibur_public_lead_form_last_submission', String(Date.now()));
      setSubmitted(true);
      setMessage('You are on the list. We will be in touch about your $350 website within 48 hours.');
      setForm({
        businessName: '',
        contactName: '',
        email: '',
        phone: '',
        presenceLink: '',
        helpNeeded: '',
        referralCode: parsed.referralCode || '',
        website: '',
      });
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'We could not send your request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-4rem] h-80 w-80 rounded-full bg-cyan-300/40 blur-3xl" />
        <div className="absolute right-[-10rem] top-[12%] h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[18%] h-80 w-80 rounded-full bg-white/80 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-8">
        <nav className="panel flex items-center justify-between rounded-full px-5 py-3">
          <div className="flex items-center gap-3">
            <img
              src={excaliburLogo}
              alt="Excalibur"
              className="h-11 w-auto rounded-xl object-contain sm:h-12"
            />
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">Excalibur</p>
              <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Small business websites</p>
            </div>
          </div>
          <span className="rounded-full border border-sky-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
            30 businesses only
          </span>
        </nav>

        <section className="grid items-stretch gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-white via-sky-50 to-blue-100/80 p-8 shadow-[0_30px_90px_rgba(68,100,180,0.16)] sm:p-12">
            <div className="absolute right-[-4rem] top-[-2rem] h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="absolute bottom-[-4rem] left-[-3rem] h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between gap-10">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full border border-sky-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600">
                  One-time website offer
                </span>
                <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.93] tracking-[-0.05em] text-slate-950 sm:text-7xl">
                  A website that works for your business. <span className="text-blue-600">$350, once.</span>
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Stop paying a monthly retainer for a site that never gets updated. Excalibur builds a polished, mobile-ready small business website for one upfront price—no surprise fees and no endless agency contract.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2"><CircleDollarSign className="h-4 w-4 text-blue-600" /> $350 one-time payment</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2"><Sparkles className="h-4 w-4 text-blue-600" /> Only 30 business spots</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FeaturePill
                  icon={ArrowRight}
                  title="No monthly retainer"
                  body="Pay once for a website you can be proud to send customers to."
                />
                <FeaturePill
                  icon={ShieldCheck}
                  title="No ghosted updates"
                  body="Get a clear, focused site instead of paying each month while nothing changes."
                />
                <FeaturePill
                  icon={CheckCircle2}
                  title="Built to earn trust"
                  body="Give prospective customers the clear information they need to call or reach out."
                />
              </div>
            </div>
          </div>

          <section className="panel rounded-[2rem] p-6 sm:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">Claim a build spot</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                Get your $350 website
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                We are opening this offer to just 30 small businesses because the value is unusually high. Share your details to see if there is still a spot for you.
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <FormInput
                label="Business name"
                value={form.businessName}
                onChange={(value) => setForm((current) => ({ ...current, businessName: value }))}
                required
              />
              <FormInput
                label="Contact name"
                value={form.contactName}
                onChange={(value) => setForm((current) => ({ ...current, contactName: value }))}
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                  required
                />
                <FormInput
                  label="Phone"
                  value={form.phone}
                  onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
                  required
                />
              </div>
              <FormInput
                label="Current website, Google, or Facebook link"
                value={form.presenceLink}
                onChange={(value) => setForm((current) => ({ ...current, presenceLink: value }))}
                required
              />
              <FormSelect
                label="Which sounds most like your situation?"
                value={form.helpNeeded}
                onChange={(value) => setForm((current) => ({ ...current, helpNeeded: value }))}
                options={helpOptions}
                required
              />

              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
                className="hidden"
                aria-hidden="true"
              />

              <button
                type="submit"
                disabled={loading || submitted}
                className="flex w-full items-center justify-center gap-2 rounded-[1.35rem] bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {submitted ? 'Request sent' : 'Claim My $350 Website Spot'}
              </button>

              {message ? (
                <InlineStatus
                  message={message}
                  success={message.includes('received') || message.includes('sent')}
                />
              ) : null}
            </form>

            <div className="mt-6 rounded-[1.5rem] border border-white/70 bg-white/70 p-5 text-sm text-slate-600 shadow-[0_14px_35px_rgba(83,112,189,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Why businesses choose this offer</p>
              <ul className="mt-3 space-y-2 pl-5 text-sm leading-6 text-slate-700">
                <li>A professional website without an expensive agency bill</li>
                <li>A clear upfront price: $350 once, not another recurring charge</li>
                <li>A site designed to make your business look credible and easy to contact</li>
              </ul>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                We&apos;ll use your information only to follow up on this offer. No spam and no sharing.
              </p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function FeaturePill({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ArrowRight;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-white/70 bg-white/78 p-5 shadow-[0_14px_35px_rgba(83,112,189,0.08)] backdrop-blur-xl">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
    </article>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm text-slate-600">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-[1.15rem] border border-slate-200 bg-white/88 px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  required?: boolean;
}) {
  return (
    <label className="block text-sm text-slate-600">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-[1.15rem] border border-slate-200 bg-white/88 px-4 py-3.5 text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      >
        <option value="" disabled>
          Select one
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function InlineStatus({ message, success = false }: { message: string; success?: boolean }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-[1.15rem] border px-4 py-3 text-sm ${
        success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}
    >
      {success ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <ShieldCheck className="mt-0.5 h-4 w-4" />}
      <span>{message}</span>
    </div>
  );
}

export default App;
