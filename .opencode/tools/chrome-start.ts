import { tool } from "@opencode-ai/plugin";
import { execSync } from "child_process";

function run(cmd: string, timeout = 10000): string {
  try {
    return execSync(cmd, { timeout, encoding: "utf-8" }).trim();
  } catch (e: any) {
    return e?.stderr?.trim() || e?.message?.trim() || "";
  }
}

function getWindowsIP(): string {
  return run("ip route show default | awk '{print $3}'");
}

export default tool({
  description: "Launch Chrome with remote debugging port on Windows (via WSL). Checks port first, starts if needed.",
  args: {},
  async execute(_args, context) {
    const lines: string[] = [];
    const ip = getWindowsIP();

    if (!ip) {
      return "WSL gateway IP not found — are you in WSL2?";
    }

    // 1. Check if already running
    lines.push("Checking Chrome status...");
    const alreadyRunning = run(`curl -sf "http://${ip}:9223/json/version"`);

    if (alreadyRunning) {
      try {
        const data = JSON.parse(alreadyRunning);
        lines.push(`✅ Chrome already running: ${data.Browser}`);
      } catch {
        lines.push("✅ Chrome already running on port 9223");
      }

      const tabs = run(`curl -sf "http://${ip}:9223/json"`);
      if (tabs) {
        try {
          const tabList = JSON.parse(tabs);
          lines.push(`📑 Open tabs: ${tabList.length}`);
          for (const t of tabList) {
            const title = (t.title || "").substring(0, 40);
            if (title) lines.push(`   ${title}`);
          }
        } catch {
          // ignore
        }
      }
      return lines.join("\n");
    }

    // 2. Check portproxy
    lines.push("\nChrome not running. Checking portproxy...");
    const proxy = run('powershell.exe -Command "netsh interface portproxy show v4tov4"');
    if (!proxy.includes("9223")) {
      lines.push("❌ Portproxy 9223→9222 not configured.");
      lines.push("   Run in PowerShell (Admin):");
      lines.push('   netsh interface portproxy add v4tov4 listenport=9223 listenaddress=0.0.0.0 connectport=9222 connectaddress=127.0.0.1');
      lines.push('   New-NetFirewallRule -DisplayName "Allow MCP Chrome Debug" -Direction Inbound -Protocol TCP -LocalPort 9223 -Action Allow');
      return lines.join("\n");
    }
    lines.push("✅ Portproxy OK");

    // 3. Launch Chrome
    lines.push("\nLaunching Chrome with remote debugging...");
    const startScript = "/home/user/.local/bin/chrome-debug";

    // Check if chrome-debug script exists
    const scriptExists = run(`test -f "${startScript}" && echo "yes"`);
    if (!scriptExists) {
      lines.push("❌ chrome-debug script not found at " + startScript);
      lines.push("   Try: double-click C:\\Temp\\chrome-debug.bat on Windows");
      return lines.join("\n");
    }

    // Run chrome-debug in background
    const output = run(`bash "${startScript}" 2>&1`, 20000);
    if (output) lines.push(output.substring(0, 300));

    // 4. Wait for Chrome
    lines.push("\nWaiting for Chrome to respond...");
    let ready = false;
    for (let i = 0; i < 15; i++) {
      const check = run(`curl -sf "http://${ip}:9223/json/version"`);
      if (check) {
        ready = true;
        try {
          const data = JSON.parse(check);
          lines.push(`✅ Chrome ready: ${data.Browser}`);
        } catch {
          lines.push("✅ Chrome ready on port 9223");
        }
        break;
      }
      const wait = run("sleep 1");
    }

    if (!ready) {
      lines.push("❌ Chrome did not start within 15 seconds.");
      lines.push("   Try: double-click C:\\Temp\\chrome-debug.bat on Windows manually.");
      lines.push("   Or run: powershell.exe -Command \"Start-Process 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' -ArgumentList '--remote-debugging-port=9222','--remote-debugging-address=0.0.0.0','--user-data-dir=C:\\Temp\\chrome-debug-profile','--no-first-run','--no-default-browser-check','about:blank'\"");
    }

    return lines.join("\n");
  },
});
