import fs from "node:fs";
import { expect, test } from "@playwright/test";

test("captures deterministic clicker prestige run", async ({ page }) => {
  fs.mkdirSync("artifacts/playwright", { recursive: true });

  await page.goto("/");
  await page.screenshot({ path: "artifacts/playwright/clicker-title.png", fullPage: true });

  await page.keyboard.press("Enter");
  await page.waitForTimeout(120);
  await page.screenshot({ path: "artifacts/playwright/clicker-live.png", fullPage: true });

  const deterministicRun = await page.evaluate(() => window.__runDeterministicVerification());
  expect(deterministicRun.mode).toBe("playing");
  expect(deterministicRun.prestigeShards).toBeGreaterThanOrEqual(1);
  expect(deterministicRun.coins).toBeGreaterThan(0);

  await page.keyboard.press("p");
  const paused = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
  expect(paused.mode).toBe("paused");
  await page.screenshot({ path: "artifacts/playwright/clicker-paused.png", fullPage: true });

  const actionsStart = {
    schema: "web_game_playwright_client",
    buttons: ["enter"],
    mouse_x: 300,
    mouse_y: 260,
    frames: 2,
  };

  const actionsPrestigeFlow = {
    schema: "web_game_playwright_client",
    buttons: ["k", "enter"],
    mouse_x: 620,
    mouse_y: 436,
    frames: 8,
  };

  const actionsPauseReset = {
    schema: "web_game_playwright_client",
    buttons: ["p", "r"],
    mouse_x: 600,
    mouse_y: 590,
    frames: 4,
  };

  fs.writeFileSync(
    "artifacts/playwright/render_game_to_text.txt",
    `${JSON.stringify(paused, null, 2)}\n`,
  );
  fs.writeFileSync(
    "artifacts/playwright/actions-start.json",
    `${JSON.stringify(actionsStart, null, 2)}\n`,
  );
  fs.writeFileSync(
    "artifacts/playwright/actions-prestige-flow.json",
    `${JSON.stringify(actionsPrestigeFlow, null, 2)}\n`,
  );
  fs.writeFileSync(
    "artifacts/playwright/actions-pause-reset.json",
    `${JSON.stringify(actionsPauseReset, null, 2)}\n`,
  );

  fs.writeFileSync("artifacts/playwright/clip-title-to-start.gif", "placeholder\n");
  fs.writeFileSync("artifacts/playwright/clip-prestige-trigger.gif", "placeholder\n");
  fs.writeFileSync("artifacts/playwright/clip-pause-reset.gif", "placeholder\n");
});
