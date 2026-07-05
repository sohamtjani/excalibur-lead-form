import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { supabase, supabaseConfigError } from './lib/supabase';

const leadFormSchema = z.object({
  businessName: z.string().min(2, 'Enter the business name.'),
  contactName: z.string().min(2, 'Enter the contact name.'),
  email: z.string().email('Use a valid email address.'),
  phone: z.string().min(7, 'Enter a valid phone number.'),
  referralCode: z.string().optional(),
  notes: z.string().optional(),
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
    referralCode: queryReferralCode,
    notes: '',
    website: '',
  });

  useEffect(() => {
    if (queryReferralCode) {
      setForm((current) => ({ ...current, referralCode: queryReferralCode }));
    }
  }, [queryReferralCode]);

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
        },
        notes: parsed.notes || null,
        submitted_referral_code: parsed.referralCode || null,
      });

      if (error) {
        throw error;
      }

      window.localStorage.setItem('excalibur_public_lead_form_last_submission', String(Date.now()));
      setSubmitted(true);
      setMessage('Your request was received. Excalibur will follow up soon.');
      setForm({
        businessName: '',
        contactName: '',
        email: '',
        phone: '',
        referralCode: parsed.referralCode || '',
        notes: '',
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
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-soft">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">Excalibur</p>
              <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Interest Form</p>
            </div>
          </div>
          <span className="rounded-full border border-sky-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
            Direct inquiries
          </span>
        </nav>

        <section className="grid items-stretch gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-white via-sky-50 to-blue-100/80 p-8 shadow-[0_30px_90px_rgba(68,100,180,0.16)] sm:p-12">
            <div className="absolute right-[-4rem] top-[-2rem] h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="absolute bottom-[-4rem] left-[-3rem] h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between gap-10">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full border border-sky-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600">
                  Tell us what you need
                </span>
                <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.93] tracking-[-0.05em] text-slate-950 sm:text-7xl">
                  Start the conversation with Excalibur.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Share your business details and a short note about what you are looking for. If someone sent you here personally, their referral code can stay attached automatically.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FeaturePill
                  icon={ArrowRight}
                  title="Simple next step"
                  body="One clean form, then the Excalibur team can take it from there."
                />
                <FeaturePill
                  icon={ShieldCheck}
                  title="Referral-safe"
                  body="Affiliate codes stay attached to the lead when this page is shared personally."
                />
                <FeaturePill
                  icon={CheckCircle2}
                  title="Fast follow-up"
                  body="Your request lands directly in the shared Excalibur pipeline."
                />
              </div>
            </div>
          </div>

          <section className="panel rounded-[2rem] p-6 sm:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">Get in touch</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                Business interest form
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Fill this out once and your request will be logged for review.
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <FormInput
                label="Business name"
                value={form.businessName}
                onChange={(value) => setForm((current) => ({ ...current, businessName: value }))}
              />
              <FormInput
                label="Contact name"
                value={form.contactName}
                onChange={(value) => setForm((current) => ({ ...current, contactName: value }))}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                />
                <FormInput
                  label="Phone"
                  value={form.phone}
                  onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
                />
              </div>
              <FormInput
                label="Referral code (optional)"
                value={form.referralCode}
                onChange={(value) => setForm((current) => ({ ...current, referralCode: value.toUpperCase() }))}
              />
              <label className="block text-sm text-slate-600">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Notes
                </span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  rows={5}
                  className="w-full rounded-[1.15rem] border border-slate-200 bg-white/88 px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>

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
                {submitted ? 'Request sent' : 'Send interest form'}
              </button>

              {message ? (
                <InlineStatus
                  message={message}
                  success={message.includes('received') || message.includes('sent')}
                />
              ) : null}
            </form>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
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
        className="w-full rounded-[1.15rem] border border-slate-200 bg-white/88 px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
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
