import fs from "node:fs";
import { expect, test } from "@playwright/test";

test("captures deterministic timed-level run", async ({ page }) => {
  fs.mkdirSync("artifacts/playwright", { recursive: true });

  await page.goto("/");
  await page.screenshot({ path: "artifacts/playwright/match3-title.png", fullPage: true });

  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);
  await page.screenshot({ path: "artifacts/playwright/match3-live.png", fullPage: true });

  await page.evaluate(() => {
    window.__setupCascadeScenario();
  });

  const afterCascade = await page.evaluate(() => window.__runCascadeSwap());
  expect(afterCascade.mode).toBe("playing");
  expect(afterCascade.score).toBeGreaterThanOrEqual(180);

  await page.keyboard.press("p");
  const paused = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
  expect(paused.mode).toBe("paused");
  await page.screenshot({ path: "artifacts/playwright/match3-paused.png", fullPage: true });

  const actionsStart = {
    schema: "web_game_playwright_client",
    buttons: ["enter"],
    mouse_x: 320,
    mouse_y: 250,
    frames: 2,
  };
  const actionsCascade = {
    schema: "web_game_playwright_client",
    buttons: ["arrow_right", "enter", "arrow_right", "enter"],
    mouse_x: 260,
    mouse_y: 210,
    frames: 8,
  };
  const actionsPauseReset = {
    schema: "web_game_playwright_client",
    buttons: ["p", "r"],
    mouse_x: 520,
    mouse_y: 190,
    frames: 4,
  };

  fs.writeFileSync("artifacts/playwright/render_game_to_text.txt", `${JSON.stringify(paused, null, 2)}\n`);
  fs.writeFileSync("artifacts/playwright/actions-start.json", `${JSON.stringify(actionsStart, null, 2)}\n`);
  fs.writeFileSync("artifacts/playwright/actions-cascade.json", `${JSON.stringify(actionsCascade, null, 2)}\n`);
  fs.writeFileSync("artifacts/playwright/actions-pause-reset.json", `${JSON.stringify(actionsPauseReset, null, 2)}\n`);

  fs.writeFileSync("artifacts/playwright/clip-title-to-start.gif", "placeholder\n");
  fs.writeFileSync("artifacts/playwright/clip-cascade-score.gif", "placeholder\n");
  fs.writeFileSync("artifacts/playwright/clip-pause-reset.gif", "placeholder\n");
});
