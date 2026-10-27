import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Orbit AI collects, uses, and protects your data.",
};

const LAST_UPDATED = "October 22, 2026";

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 space-y-10 text-base leading-relaxed text-neutral-600">
        <div>
          <p>
            Orbit AI (&quot;Orbit,&quot; &quot;we,&quot; &quot;us&quot;) provides an AI marketing agent that
            researches trends, drafts social media content, and publishes it on your behalf to the platforms
            you connect. This policy explains what information we collect, how we use it, and the choices
            you have. It applies to orbitai.co.in and the Orbit dashboard.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Information we collect</h2>
          <div className="mt-4 space-y-4">
            <p>
              <strong className="text-neutral-800">Account information.</strong> When you sign up, we collect
              your email address (via Firebase Authentication, including Google Sign-In if you use it), your
              business/account name, and the type of account you select.
            </p>
            <p>
              <strong className="text-neutral-800">Connected social platforms.</strong> When you connect X,
              Threads, LinkedIn, or Instagram, we store an encrypted access token for that platform, along
              with your public profile ID and username on that platform. We never see or store your password
              for any connected platform — authorization happens entirely through that platform&apos;s own
              OAuth login screen.
            </p>
            <p>
              <strong className="text-neutral-800">Content you provide and content we generate.</strong>{" "}
              Knowledge base entries you write (brand voice, content guidelines), draft posts, replies, Reels,
              and Carousels generated on your behalf, and your approval/edit/rejection history for each.
            </p>
            <p>
              <strong className="text-neutral-800">Data from connected platforms.</strong> Where relevant to
              the features you use, we read mentions/conversations directed at your connected X account, and
              performance insights (likes, comments, reach, saves, shares) for Instagram posts published
              through Orbit. We only access what&apos;s needed for the specific feature — see &quot;Social
              platform permissions&quot; below for exactly what each connection is used for.
            </p>
            <p>
              <strong className="text-neutral-800">Billing information.</strong> If you subscribe to a paid
              plan, payment is processed by Razorpay. We store the resulting order ID, payment ID, and billing
              currency — we never see or store your card number or other raw payment details; Razorpay
              handles that directly.
            </p>
            <p>
              <strong className="text-neutral-800">Usage data.</strong> Basic technical data needed to operate
              the service reliably and securely — request IPs (for rate limiting and abuse prevention),
              session cookies, and logs of automated runs (what the AI did and when).
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">How we use your information</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>To operate Orbit: research trends, draft content in your brand voice, and publish approved content to your connected platforms.</li>
            <li>To show you what the AI found and drafted, so you can approve, edit, or reject it before anything goes out under your name.</li>
            <li>To improve future drafts based on which of your own posts actually performed well (Instagram insights only, used solely for your own account&apos;s future content — never shared with or compared against other customers).</li>
            <li>To process payments and manage your subscription.</li>
            <li>To send you operational emails — e.g. notifying you when an automated run completes, or when a new account signs up (sent only to the account owner, not to other customers).</li>
            <li>To secure the service — rate limiting, fraud prevention, and debugging.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Social platform permissions</h2>
          <p className="mt-4">When you connect a platform, you grant Orbit only the specific permissions needed for the features you use:</p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li><strong className="text-neutral-800">Instagram</strong> (<code className="text-sm">instagram_business_basic</code>, <code className="text-sm">instagram_business_content_publish</code>, <code className="text-sm">instagram_business_manage_insights</code>): read your basic profile, publish Reels/Carousels you&apos;ve approved, and read performance insights for posts published through Orbit.</li>
            <li><strong className="text-neutral-800">Threads</strong> (<code className="text-sm">threads_basic</code>, <code className="text-sm">threads_content_publish</code>): read your basic profile and publish posts you&apos;ve approved.</li>
            <li><strong className="text-neutral-800">X</strong>: read mentions directed at your account and publish posts/replies you&apos;ve approved.</li>
            <li><strong className="text-neutral-800">LinkedIn</strong>: publish posts you&apos;ve approved to your own profile.</li>
          </ul>
          <p className="mt-4">
            Nothing is ever published automatically to a platform without either your explicit approval, or
            falling under an automation tier you&apos;ve chosen in Settings for low-risk content — and even
            then, sensitive or ambiguous content always waits for your review.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Third-party services we use</h2>
          <p className="mt-4">
            We use the following subprocessors to operate Orbit. Each only receives the data necessary to
            perform its function:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li><strong className="text-neutral-800">Vercel</strong> — application hosting.</li>
            <li><strong className="text-neutral-800">Neon</strong> — database hosting (Postgres).</li>
            <li><strong className="text-neutral-800">Upstash</strong> — rate limiting and short-lived caching (Redis).</li>
            <li><strong className="text-neutral-800">Inngest</strong> — background job orchestration for automated agent runs.</li>
            <li><strong className="text-neutral-800">Firebase (Google)</strong> — account authentication.</li>
            <li><strong className="text-neutral-800">Groq</strong> — AI text generation for research, drafting, and classification.</li>
            <li><strong className="text-neutral-800">Google Gemini API</strong> — AI image, video, and voice generation for Reels.</li>
            <li><strong className="text-neutral-800">Unsplash</strong> — stock photography for Carousel slide backgrounds.</li>
            <li><strong className="text-neutral-800">Resend</strong> — transactional email.</li>
            <li><strong className="text-neutral-800">Razorpay</strong> — payment processing.</li>
            <li><strong className="text-neutral-800">Meta (Instagram, Threads), X, LinkedIn</strong> — the social platforms you choose to connect.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Data security</h2>
          <p className="mt-4">
            Access tokens for connected platforms are encrypted at rest (AES-256-GCM). We use industry-standard
            practices to protect your data, but no method of transmission or storage is 100% secure, and we
            can&apos;t guarantee absolute security.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Data retention and deletion</h2>
          <p className="mt-4">
            We retain your data for as long as your account is active. Disconnecting a platform in Settings
            immediately deletes that platform&apos;s stored access token. To request deletion of your account
            and all associated data, see our{" "}
            <a href="/data-deletion" className="font-medium text-neutral-900 underline">
              Data Deletion Instructions
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Children&apos;s privacy</h2>
          <p className="mt-4">
            Orbit is not directed at children under 16, and we do not knowingly collect information from them.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Changes to this policy</h2>
          <p className="mt-4">
            We may update this policy from time to time. We&apos;ll update the &quot;Last updated&quot; date
            above when we do.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Contact</h2>
          <p className="mt-4">
            Questions about this policy or your data? Email{" "}
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
