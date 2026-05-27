import { expect, test } from "@playwright/test";

const BOHAIRIC_NOUNS_PATH = "/en/practice?deck=bohairic-nouns";
const MIXED_REVIEW_PATH = "/en/practice?deck=mixed-dictionary-grammar";

test("practice picker groups mixed, word, grammar, and saved practice", async ({
  page,
}) => {
  await page.goto(MIXED_REVIEW_PATH);

  await page.getByRole("button", { name: "Change practice" }).click();

  const dialog = page.getByRole("dialog", { name: /Choose practice/ });

  await expect(
    dialog.getByRole("heading", { name: "Mixed practice" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Word practice" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Grammar practice" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Saved practice" }),
  ).toBeVisible();
  await expect(dialog.getByText("Daily Mixed Practice")).toBeVisible();
  await expect(dialog.getByText("Current")).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: /Grammar Lesson 1/ }),
  ).toHaveAttribute("href", "/en/practice?deck=grammar-lesson-1");
  await expect(
    dialog.getByRole("link", { name: /Saved Entries/ }),
  ).toHaveAttribute("href", /\/login/);
});

test("mobile practice setup can collapse after selecting a card type", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BOHAIRIC_NOUNS_PATH);

  const setupToggle = page.getByRole("button", { name: /Practice setup/ });

  await expect(setupToggle).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("button", { name: "Change practice" }),
  ).toBeHidden();

  await setupToggle.click();
  await expect(setupToggle).toHaveAttribute("aria-expanded", "true");

  await page.getByRole("button", { name: "Meaning → Coptic" }).click();
  await expect(setupToggle).toContainText("selected");

  await setupToggle.click();
  await expect(setupToggle).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("button", { name: "Change practice" }),
  ).toBeHidden();
});

test("practice answer context shows the dialect form instead of the headword", async ({
  page,
}) => {
  await page.goto(BOHAIRIC_NOUNS_PATH);

  await page.getByRole("button", { name: "Reveal answer" }).click();

  const answerContextButton = page.getByRole("button", {
    name: /Answer context/,
  });
  const answerContextPanel = page.locator("section.mt-3").filter({
    has: answerContextButton,
  });

  await expect(answerContextButton).toContainText("ⲟⲩⲱⲓⲛⲓ");
  await answerContextButton.click();

  await expect(answerContextPanel).toContainText("Form");
  await expect(answerContextPanel).toContainText("ⲟⲩⲱⲓⲛⲓ");
  await expect(answerContextPanel).not.toContainText("ⲟⲩⲟⲉⲓⲛ");
});
