import { tool } from "@opencode-ai/plugin";
import { execSync } from "child_process";

function run(cmd: string): string {
  try {
    return execSync(cmd, { timeout: 8000, encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

export default tool({
  description: "Check WSL Chromium CDP status on port 9224, open tabs, and MCP connection",
  args: {},
  async execute(_args, context) {
    const lines: string[] = [];

    // 1. Chromium debug port
    const version = run("curl -sf http://127.0.0.1:9224/json/version");
    if (version) {
      try {
        const data = JSON.parse(version);
        lines.push(`✅ WSL Chromium: ${data.Browser} (CDP ${data["Protocol-Version"]})`);
      } catch {
        lines.push("✅ WSL Chromium: port 9224 responds");
      }
    } else {
      lines.push("❌ WSL Chromium: NOT reachable on port 9224");
      lines.push("   → Run: chrome-start-wsl");
      lines.push("   Or manually: chromium --remote-debugging-port=9224 about:blank");
    }

    // 2. Chromium processes
    const procs = run("ps aux | grep 'chromium.*remote-debugging-port=9224' | grep -v grep");
    if (procs) {
      lines.push(`\n✅ Chromium process: running`);
    } else if (version) {
      lines.push("\n⚠️  Port responds but no process found — may be stale");
    } else {
      lines.push("\n❌ Chromium process: not running");
    }

    // 3. Open tabs
    const tabsJson = run("curl -sf http://127.0.0.1:9224/json");
    if (tabsJson) {
      try {
        const tabs = JSON.parse(tabsJson);
        lines.push(`\n📑 Tabs (${tabs.length}):`);
        for (const t of tabs) {
          const url = (t.url || "").substring(0, 70);
          const title = (t.title || "").substring(0, 50);
          lines.push(`   ${title.padEnd(30)} ${url}`);
        }
      } catch {
        // ignore
      }
    }

    // 4. Check if frontend/dev server is accessible from WSL
    const dev = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/");
    if (dev === "200") {
      lines.push("\n✅ Dev server (localhost:5173): running");
    } else {
      const fileServer = run("curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5500/");
      if (fileServer === "200" || fileServer === "301") {
        lines.push("\n✅ File server (127.0.0.1:5500): running");
      } else {
        lines.push("\n⚪ Dev server (localhost:5173): not running");
      }
    }

    // 5. MCP status
    const mcp = run("opencode mcp ls 2>/dev/null");
    if (mcp.includes("chrome-devtools-wsl")) {
      lines.push("\n✅ MCP chrome-devtools-wsl: configured");
    } else {
      lines.push("\n⚪ MCP chrome-devtools-wsl: not configured in opencode.json");
    }

    return lines.join("\n");
  },
});
