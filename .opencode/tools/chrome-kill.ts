import { tool } from "@opencode-ai/plugin";
import { execSync } from "child_process";

function run(cmd: string): string {
  try {
    return execSync(cmd, { timeout: 8000, encoding: "utf-8" }).trim();
  } catch (e: any) {
    return e?.stderr?.trim() || e?.message?.trim() || "";
  }
}

function getWindowsIP(): string {
  return run("ip route show default | awk '{print $3}'");
}

export default tool({
  description: "Kill all Chrome processes on Windows and verify port is freed",
  args: {},
  async execute(_args, context) {
    const lines: string[] = [];
    const ip = getWindowsIP();

    lines.push("Killing Chrome processes on Windows...");

    // Kill Chrome via taskkill
    const kill = run('powershell.exe -Command "taskkill /F /IM chrome.exe 2>&1"');
    const killedCount = (kill.match(/успешно|success|успех/gi) || []).length;
    if (killedCount > 0) {
      lines.push(`✅ Killed ${killedCount} Chrome process(es)`);
    } else if (kill.includes("не найден") || kill.includes("not found")) {
      lines.push("⚪ No Chrome processes to kill");
    } else {
      lines.push(`ℹ️  ${kill.substring(0, 100)}`);
    }

    // Wait for port to free
    if (ip) {
      lines.push("\nWaiting for port 9223 to free...");
      for (let i = 0; i < 10; i++) {
        const check = run(`curl -sf --connect-timeout 1 "http://${ip}:9223/json/version"`);
        if (!check) {
          lines.push("✅ Port 9223 is free");
          break;
        }
        run("sleep 1");
      }

      // Final check
      const finalCheck = run(`curl -sf --connect-timeout 2 "http://${ip}:9223/json/version"`);
      if (finalCheck) {
        try {
          const data = JSON.parse(finalCheck);
          lines.push(`⚠️  Chrome still running: ${data.Browser}`);
          lines.push("   Try: chrome-kill again, or kill manually from Windows Task Manager");
        } catch {
          lines.push("⚠️  Port still responds. Try chrome-kill again.");
        }
      } else {
        lines.push("✅ Chrome fully stopped");
      }
    }

    // Show portproxy status
    const proxy = run('powershell.exe -Command "netsh interface portproxy show v4tov4"');
    if (proxy.includes("9223")) {
      lines.push("\n✅ Portproxy rule preserved (9223→9222)");
    }

    lines.push("\nDone. To restart Chrome: chrome-start");

    return lines.join("\n");
  },
});
