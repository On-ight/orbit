import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply to using Orbit AI.",
};

const LAST_UPDATED = "October 22, 2026";

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">Terms of Service</h1>
      <p className="mt-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 space-y-10 text-base leading-relaxed text-neutral-600">
        <div>
          <p>
            These terms govern your use of Orbit AI (&quot;Orbit,&quot; &quot;we,&quot; &quot;us&quot;), the
            AI marketing agent available at orbitai.co.in. By creating an account, you agree to these terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">1. The service</h2>
          <p className="mt-4">
            Orbit researches trends relevant to your business, drafts social media content in your brand
            voice, and — depending on the automation level you choose — either publishes low-risk content
            automatically or holds everything for your review in an approval queue. You control which risk
            tiers are allowed to publish without your sign-off; sensitive or ambiguous content is always held
            for manual review regardless of your settings.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">2. Your account</h2>
          <p className="mt-4">
            You&apos;re responsible for maintaining the security of your account credentials and for all
            activity that happens under your account, including content published through your connected
            social platforms. Notify us promptly if you suspect unauthorized access.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">3. Connected platforms</h2>
          <p className="mt-4">
            When you connect X, Threads, LinkedIn, or Instagram, you authorize Orbit to read and publish
            content on your behalf through that platform&apos;s own API, subject to the permissions you grant
            during that platform&apos;s own authorization screen. You remain responsible for complying with
            each connected platform&apos;s own terms of service and content policies — Orbit is a tool you use
            to post, not a substitute for your own judgment about what&apos;s appropriate to publish.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">4. AI-generated content</h2>
          <p className="mt-4">
            Orbit uses AI to research and draft content. AI-generated drafts can contain errors, and you are
            solely responsible for reviewing content before it publishes — whether you approve it manually or
            allow it to auto-publish under a risk tier you&apos;ve configured. We are not liable for the
            consequences of content published through your account, approved or automated.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">5. Plans and billing</h2>
          <p className="mt-4">
            Paid plans are billed monthly in advance through Razorpay. The Free plan is a time-limited trial
            and does not recur or auto-charge. Subscriptions renew automatically each billing period until
            canceled; you can cancel any time from Settings, effective at the end of the current billing
            period. Fees are non-refundable except where required by law.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">6. Acceptable use</h2>
          <p className="mt-4">You agree not to use Orbit to:</p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>Publish content that is illegal, fraudulent, defamatory, or that infringes someone else&apos;s rights.</li>
            <li>Impersonate another person or organization, or misrepresent your affiliation with one.</li>
            <li>Attempt to circumvent the approval/risk-tier safeguards built into the product.</li>
            <li>Interfere with or disrupt the service, or attempt to access it through means other than the interface we provide.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">7. Intellectual property</h2>
          <p className="mt-4">
            You own the content Orbit drafts for your account once it&apos;s approved and published — it&apos;s
            yours to use however you see fit. We own the Orbit platform itself, including its software,
            design, and branding.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">8. Disclaimers</h2>
          <p className="mt-4">
            Orbit is provided &quot;as is&quot; without warranties of any kind, express or implied. We don&apos;t
            guarantee uninterrupted availability, that AI-generated content will always be accurate or
            on-brand, or that connected third-party platforms (X, Threads, LinkedIn, Instagram, Razorpay, and
            others) will remain available or unchanged.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">9. Limitation of liability</h2>
          <p className="mt-4">
            To the fullest extent permitted by law, Orbit and its team are not liable for indirect,
            incidental, or consequential damages arising from your use of the service, including content
            published through your connected accounts.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">10. Termination</h2>
          <p className="mt-4">
            You may stop using Orbit and disconnect your platforms at any time. We may suspend or terminate
            accounts that violate these terms or that we reasonably believe pose a risk to the service or
            other users.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">11. Governing law</h2>
          <p className="mt-4">
            These terms are governed by the laws of India, without regard to conflict-of-law principles.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">12. Changes to these terms</h2>
          <p className="mt-4">
            We may update these terms from time to time. We&apos;ll update the &quot;Last updated&quot; date
            above when we do, and continued use of Orbit after a change means you accept the updated terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Contact</h2>
          <p className="mt-4">
            Questions about these terms? Email{" "}
            <a href="mailto:orbit11ai11@gmail.com" className="font-medium text-neutral-900 underline">
              orbit11ai11@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
