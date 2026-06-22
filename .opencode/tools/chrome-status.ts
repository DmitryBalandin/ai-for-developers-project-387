import { tool } from "@opencode-ai/plugin";
import { execSync } from "child_process";

function run(cmd: string): string {
  try {
    return execSync(cmd, { timeout: 8000, encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

function getWindowsIP(): string {
  return run("ip route show default | awk '{print $3}'");
}

export default tool({
  description: "Check Chrome remote debugging status, MCP connection, portproxy, and open tabs",
  args: {},
  async execute(_args, context) {
    const lines: string[] = [];
    const ip = getWindowsIP();

    if (!ip) {
      return "WSL gateway IP not found — are you in WSL2?";
    }

    lines.push(`Windows IP: ${ip}\n`);

    // 1. Chrome debug port
    const version = run(`curl -sf "http://${ip}:9223/json/version"`);
    if (version) {
      try {
        const data = JSON.parse(version);
        lines.push(`✅ Chrome: ${data.Browser} (CDP ${data["Protocol-Version"]})`);
      } catch {
        lines.push(`✅ Chrome: port ${ip}:9223 responds`);
      }
    } else {
      lines.push("❌ Chrome: NOT reachable on port 9223\n   → Run: chrome-start   or double-click C:\\Temp\\chrome-debug.bat");
    }

    // 2. Open tabs
    const tabsJson = run(`curl -sf "http://${ip}:9223/json"`);
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
        // ignore parse errors
      }
    }

    // 3. Portproxy
    const proxy = run('powershell.exe -Command "netsh interface portproxy show v4tov4"');
    if (proxy.includes("9223")) {
      lines.push("\n✅ Portproxy: 9223 → 127.0.0.1:9222");
    } else {
      lines.push("\n❌ Portproxy: NOT configured\n   → Run PowerShell (Admin): netsh interface portproxy add v4tov4 listenport=9223 listenaddress=0.0.0.0 connectport=9222 connectaddress=127.0.0.1");
    }

    // 4. MCP status
    const mcp = run("opencode mcp ls 2>/dev/null");
    if (mcp.includes("chrome-devtools")) {
      lines.push("\n✅ MCP chrome-devtools: connected");
    } else {
      lines.push("\n❌ MCP chrome-devtools: NOT connected\n   → Restart OpenCode or check opencode.json");
    }

    // 5. Dev server
    const dev = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/");
    if (dev === "200") {
      lines.push("✅ Dev server (localhost:5173): running");
    } else {
      lines.push("⚪ Dev server (localhost:5173): not running\n   → Run: npm run dev");
    }

    return lines.join("\n");
  },
});
