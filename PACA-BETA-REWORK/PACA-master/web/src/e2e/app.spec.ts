import { expect, test } from "@playwright/test"

test("shows PACA BETA branding and the Luau target", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("파카난독화기")).toBeVisible()
  await expect(page.getByText("BETA").first()).toBeVisible()
  await expect(page.getByText("대상 언어 · Roblox Luau")).toBeVisible()
  await expect(page.getByText("PACA Anti-Tamper", { exact: false })).toHaveCount(0)
})

test("removes standalone anti-tamper controls", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("checkbox")).toHaveCount(0)
})
