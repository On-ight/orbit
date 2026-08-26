// Server component — every action here is a plain link/form submit (an
// OAuth redirect, an external link, a POST-and-redirect disconnect), so
// none of this needs client-side JS.

interface XConnection {
  connected: boolean;
  username?: string;
}

interface BufferConnection {
  connected: boolean;
}

const BUFFER_URL = "https://publish.buffer.com/";

function Avatar({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
      style={{ background: "linear-gradient(135deg, #6229CE, #8E42FC 55%, #BC69EB)" }}
    >
      {children}
    </span>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`h-2 w-2 rounded-full ${ok ? "" : "bg-neutral-300"}`}
      style={ok ? { background: "#8E42FC" } : undefined}
    />
  );
}

export function ConnectionsPanel({
  x,
  threads,
  linkedin,
  notice,
}: {
  x: XConnection;
  threads: BufferConnection;
  linkedin: BufferConnection;
  notice?: { kind: "success" | "error"; message: string } | null;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
      <div style={{ background: "linear-gradient(120deg, #6229CE, #8E42FC 55%, #BC69EB)" }} className="px-6 py-6">
        <h2 className="text-lg font-semibold text-white">Connect your accounts</h2>
        <p className="mt-1 text-sm text-white/85">
          Pick a platform to connect it — Orbit AI can only draft and publish once it's linked.
        </p>
      </div>

      {notice && (
        <div
          className={`px-6 py-3 text-sm ${
            notice.kind === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="grid gap-5 p-6 sm:grid-cols-3">
        {/* X — direct connect */}
        <div className="flex flex-col rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-300 hover:shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar>𝕏</Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-neutral-900">X</p>
              <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                <StatusDot ok={x.connected} />
                {x.connected ? `Connected as @${x.username}` : "Not connected"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex-1" />

          <a
            href="/api/connections/x/start"
            className="block rounded-lg px-4 py-2 text-center text-sm font-medium text-white transition hover:opacity-90"
            style={{ background: "linear-gradient(120deg, #6229CE, #BC69EB)" }}
          >
            {x.connected ? "Reconnect" : "Connect X"}
          </a>
          {x.connected && (
            <form action="/api/connections/x/disconnect" method="POST" className="mt-2 text-center">
              <button type="submit" className="text-xs text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline">
                Disconnect
              </button>
            </form>
          )}
        </div>

        {/* Threads — via Buffer */}
        <div className="flex flex-col rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-300 hover:shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar>@</Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-neutral-900">Threads</p>
              <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                <StatusDot ok={threads.connected} />
                {threads.connected ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex-1" />

          <a
            href={BUFFER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-neutral-300 px-4 py-2 text-center text-sm font-medium text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-50"
          >
            Connect via Buffer
          </a>
          <p className="mt-2 text-center text-[11px] font-medium text-red-500">
            Requires a third-party service (Buffer)
          </p>
        </div>

        {/* LinkedIn — via Buffer */}
        <div className="flex flex-col rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-300 hover:shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar>in</Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-neutral-900">LinkedIn</p>
              <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                <StatusDot ok={linkedin.connected} />
                {linkedin.connected ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex-1" />

          <a
            href={BUFFER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-neutral-300 px-4 py-2 text-center text-sm font-medium text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-50"
          >
            Connect via Buffer
          </a>
          <p className="mt-2 text-center text-[11px] font-medium text-red-500">
            Requires a third-party service (Buffer)
          </p>
        </div>
      </div>
    </section>
  );
}
