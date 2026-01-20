"use client";

import { useState } from "react";

interface CommandResponse {
  reasoning: string;
  commands: Array<{
    command: string;
    comment: string;
    safety: "safe" | "warning" | "dangerous";
  }>;
  dependencies: string[];
  warnings: string[];
}

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CommandResponse | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Array<{ input: string; response: CommandResponse }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective: input }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data);
      setHistory((prev) => [...prev, { input, response: data }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getSafetyColor = (safety: string) => {
    switch (safety) {
      case "safe":
        return "text-terminal-success";
      case "warning":
        return "text-terminal-warning";
      case "dangerous":
        return "text-terminal-error";
      default:
        return "text-terminal-text";
    }
  };

  const getSafetyIcon = (safety: string) => {
    switch (safety) {
      case "safe":
        return "✓";
      case "warning":
        return "⚠";
      case "dangerous":
        return "✗";
      default:
        return "•";
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-terminal-prompt terminal-glow mb-2">
            $ Terminal Orchestrator
          </h1>
          <p className="text-terminal-text/70">
            Translate natural language to precise shell commands
          </p>
        </header>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your objective (e.g., 'Find all .log files modified in the last 7 days')"
              className="flex-1 bg-terminal-bg border border-terminal-prompt/30 rounded px-4 py-3 text-terminal-text placeholder-terminal-text/40 focus:outline-none focus:border-terminal-prompt terminal-border transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-terminal-prompt text-terminal-bg px-6 py-3 rounded font-semibold hover:bg-terminal-prompt/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Processing..." : "Execute"}
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-terminal-error/10 border border-terminal-error/30 rounded">
            <p className="text-terminal-error">⚠ {error}</p>
          </div>
        )}

        {/* Response Display */}
        {response && (
          <div className="space-y-6 mb-8">
            {/* Reasoning Section */}
            <section className="bg-terminal-bg/50 border border-terminal-prompt/20 rounded p-5">
              <h2 className="text-terminal-prompt font-bold text-lg mb-3">
                ### PHASE 1: REASONING
              </h2>
              <p className="text-terminal-text/90 leading-relaxed whitespace-pre-wrap">
                {response.reasoning}
              </p>
            </section>

            {/* Dependencies */}
            {response.dependencies.length > 0 && (
              <section className="bg-terminal-bg/50 border border-terminal-warning/20 rounded p-5">
                <h3 className="text-terminal-warning font-bold mb-2">
                  Dependencies:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {response.dependencies.map((dep, idx) => (
                    <li key={idx} className="text-terminal-text/80">
                      {dep}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Warnings */}
            {response.warnings.length > 0 && (
              <section className="bg-terminal-error/10 border border-terminal-error/30 rounded p-5">
                <h3 className="text-terminal-error font-bold mb-2">⚠ Warnings:</h3>
                <ul className="space-y-2">
                  {response.warnings.map((warning, idx) => (
                    <li key={idx} className="text-terminal-warning">
                      {warning}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Commands Section */}
            <section className="bg-terminal-bg/50 border border-terminal-success/20 rounded p-5">
              <h2 className="text-terminal-success font-bold text-lg mb-4">
                ### PHASE 2: EXECUTION
              </h2>
              <div className="space-y-4">
                {response.commands.map((cmd, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className={`${getSafetyColor(cmd.safety)} font-bold`}>
                        {getSafetyIcon(cmd.safety)}
                      </span>
                      <p className="text-terminal-text/70 italic"># {cmd.comment}</p>
                    </div>
                    <div className="bg-black/40 rounded p-3 border border-terminal-text/10">
                      <code className="text-terminal-success font-mono break-all">
                        {cmd.command}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* History */}
        {history.length > 0 && !response && (
          <section className="mt-12">
            <h2 className="text-terminal-prompt font-bold text-xl mb-4">Command History</h2>
            <div className="space-y-4">
              {history.slice().reverse().map((item, idx) => (
                <div
                  key={idx}
                  className="bg-terminal-bg/30 border border-terminal-text/10 rounded p-4 hover:border-terminal-prompt/30 transition-all cursor-pointer"
                  onClick={() => setInput(item.input)}
                >
                  <p className="text-terminal-prompt font-semibold mb-2">
                    $ {item.input}
                  </p>
                  <p className="text-terminal-text/50 text-sm">
                    {item.response.commands.length} command(s) generated
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-terminal-text/40 text-sm">
          <p>
            Terminal Orchestrator • Autonomous CLI Agent • Built with Next.js & Claude
          </p>
        </footer>
      </div>
    </main>
  );
}
