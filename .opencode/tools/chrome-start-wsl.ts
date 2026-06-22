import { tool } from "@opencode-ai/plugin";
import { execSync } from "child_process";

function run(cmd: string, timeout = 10000): string {
  try {
    return execSync(cmd, { timeout, encoding: "utf-8" }).trim();
  } catch (e: any) {
    return e?.stderr?.trim() || e?.message?.trim() || "";
  }
}

export default tool({
  description: "Launch WSL Chromium with remote debugging port 9224 for CDP access via chrome-devtools-wsl MCP",
  args: {},
  async execute(_args, context) {
    const lines: string[] = [];

    // 1. Check if already running
    lines.push("Checking WSL Chromium status...");
    const alreadyRunning = run("curl -sf http://127.0.0.1:9224/json/version");

    if (alreadyRunning) {
      try {
        const data = JSON.parse(alreadyRunning);
        lines.push(`✅ WSL Chromium already running: ${data.Browser}`);
      } catch {
        lines.push("✅ WSL Chromium already running on port 9224");
      }

      const tabs = run("curl -sf http://127.0.0.1:9224/json");
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

    // 2. Launch WSL Chromium
    lines.push("\nLaunching WSL Chromium with remote debugging on port 9224...");

    const display = run("echo $DISPLAY");
    if (!display) {
      lines.push("⚠️  DISPLAY variable not set. Chromium may not show GUI.");
    }

    const chromePath = "/snap/bin/chromium";
    const userDataDir = "/tmp/chromium-wsl-profile";

    const runInBg = `nohup ${chromePath} --remote-debugging-port=9224 --remote-debugging-address=0.0.0.0 --user-data-dir=${userDataDir} --no-first-run --no-default-browser-check --disable-features=TFLiteLanguageDetectionEnabled about:blank > /tmp/chromium-wsl.log 2>&1 &`;
    const output = run(runInBg, 5000);
    if (output) lines.push(`   ${output.substring(0, 200)}`);

    // 3. Wait for Chromium
    lines.push("\nWaiting for Chromium to respond...");
    let ready = false;
    for (let i = 0; i < 15; i++) {
      const check = run("curl -sf http://127.0.0.1:9224/json/version");
      if (check) {
        ready = true;
        try {
          const data = JSON.parse(check);
          lines.push(`✅ WSL Chromium ready: ${data.Browser}`);
        } catch {
          lines.push("✅ WSL Chromium ready on port 9224");
        }
        break;
      }
      run("sleep 1");
    }

    if (!ready) {
      lines.push("❌ Chromium did not start within 15 seconds.");
      lines.push("   Check /tmp/chromium-wsl.log for details.");
      lines.push("   Run manually: chromium --remote-debugging-port=9224 about:blank");
    }

    lines.push("\nNow enable the MCP server:");
    lines.push("   Set \"chrome-devtools-wsl\" → \"enabled\": true in opencode.json");
    lines.push("   Then restart OpenCode (or run: opencode mcp restart)");

    return lines.join("\n");
  },
});
