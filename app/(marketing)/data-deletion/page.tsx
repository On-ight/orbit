import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Instructions",
  description: "How to delete your data from Orbit AI.",
};

export default function DataDeletionPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">Data Deletion Instructions</h1>

      <div className="mt-10 space-y-8 text-base leading-relaxed text-neutral-600">
        <p>
          You can remove your data from Orbit in two ways, depending on how much you want to delete.
        </p>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Disconnect a single platform</h2>
          <p className="mt-4">
            To immediately delete the stored access token for a specific connected platform (X, Threads,
            LinkedIn, or Instagram), go to <strong className="text-neutral-800">Settings</strong> in your
            Orbit dashboard and click <strong className="text-neutral-800">Disconnect</strong> next to that
            platform. This removes Orbit&apos;s stored access to that account right away — Orbit can no longer
            read from or publish to it.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Delete your entire account</h2>
          <p className="mt-4">
            To request deletion of your account and all associated data — connected platform tokens, drafted
            and published content history, knowledge base entries, and billing records — email{" "}
            <a href="mailto:orbit11ai11@gmail.com" className="font-medium text-neutral-900 underline">
              orbit11ai11@gmail.com
            </a>{" "}
            from the email address on your account, with the subject line &quot;Delete my account.&quot;
            We&apos;ll confirm the request and complete deletion within 30 days. Billing records required for
            legal/tax compliance may be retained beyond that where we&apos;re required to by law.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Coming from Instagram or Threads?</h2>
          <p className="mt-4">
            If you arrived here from Instagram&apos;s or Threads&apos; own app settings to remove Orbit&apos;s
            access, disconnecting the platform in Orbit&apos;s Settings (above) immediately deletes the access
            token on our side. You can also revoke access directly from Instagram/Threads&apos; own
            Settings → Apps and Websites at any time, independent of Orbit.
          </p>
        </div>
      </div>
    </section>
  );
}
