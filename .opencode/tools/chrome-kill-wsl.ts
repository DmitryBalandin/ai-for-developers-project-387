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
  description: "Kill WSL Chromium processes (CDP port 9224) and verify port is freed",
  args: {},
  async execute(_args, context) {
    const lines: string[] = [];

    lines.push("Killing WSL Chromium processes...");

    // 1. Find processes with remote debugging port 9224
    const pids = run("ps aux | grep 'chromium.*remote-debugging-port=9224' | grep -v grep | awk '{print $2}'");

    if (pids) {
      const count = pids.split("\n").length;
      const kill = run(`kill ${pids.replace(/\n/g, " ")} 2>&1`);
      // Give it a moment
      run("sleep 1");
      // Force kill if still running
      const remaining = run("ps aux | grep 'chromium.*remote-debugging-port=9224' | grep -v grep | awk '{print $2}'");
      if (remaining) {
        run(`kill -9 ${remaining.replace(/\n/g, " ")} 2>&1`);
        run("sleep 1");
        lines.push(`✅ Killed ${count} Chromium process(es) (force)`);
      } else {
        lines.push(`✅ Killed ${count} Chromium process(es)`);
      }
    } else {
      // Try broader kill
      const broadKill = run("pkill -f 'chromium.*remote-debugging' 2>&1");
      if (broadKill === "") {
        lines.push("⚪ No Chromium processes to kill");
      } else {
        lines.push(`✅ ${broadKill}`);
      }
    }

    // 2. Wait for port to free
    lines.push("\nWaiting for port 9224 to free...");
    let freed = false;
    for (let i = 0; i < 10; i++) {
      const check = run("curl -sf --connect-timeout 1 http://127.0.0.1:9224/json/version");
      if (!check) {
        lines.push("✅ Port 9224 is free");
        freed = true;
        break;
      }
      run("sleep 1");
    }

    if (!freed) {
      lines.push("⚠️  Port 9224 still responds. Try chrome-kill-wsl again.");
    }

    // 3. Clean up user data dir
    const dataDir = "/tmp/chromium-wsl-profile";
    const dirExists = run(`test -d "${dataDir}" && echo "yes"`);
    if (dirExists) {
      run(`rm -rf "${dataDir}" 2>/dev/null`);
      lines.push("\n🧹 Cleaned up /tmp/chromium-wsl-profile");
    }

    lines.push("\nTo restart: chrome-start-wsl");
    lines.push("To switch back to Windows Chrome:");
    lines.push("   Set \"chrome-devtools-wsl\" → \"enabled\": false in opencode.json");
    lines.push("   Set \"chrome-devtools\" → \"enabled\": true");

    return lines.join("\n");
  },
});
