import { expect, test } from "@playwright/test";

const DUTCH_LANGUAGE_COOKIE = {
  name: "app-language",
  value: "nl",
  url: "http://127.0.0.1:3100",
};
const FLOATING_ASSISTANT_TIMEOUT_MS = 15_000;

test("root route redirects to the English homepage", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "Coptic Compass" }),
  ).toBeVisible();
});

test("root route honors the Dutch language preference", async ({ page }) => {
  await page.context().addCookies([DUTCH_LANGUAGE_COOKIE]);
  await page.goto("/");

  await expect(page).toHaveURL(/\/nl$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
});

test("English locale renders English navigation", async ({ page }) => {
  await page.goto("/en");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page
      .locator("header")
      .getByRole("link", { name: "Publications", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Coptic Compass" }),
  ).toBeVisible();
});

test("Dutch locale renders Dutch navigation", async ({ page }) => {
  await page.goto("/nl");

  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await expect(
    page
      .locator("header")
      .getByRole("link", { name: "Publicaties", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Coptic Compass" }),
  ).toBeVisible();
});

test("floating Shenute assistant opens on demand", async ({ page }) => {
  await page.goto("/en");

  await page.getByRole("button", { name: "Open Shenute AI" }).click();

  await expect(page.getByText("Page context: Home")).toBeVisible({
    timeout: FLOATING_ASSISTANT_TIMEOUT_MS,
  });
  await expect(page.getByRole("button", { name: "Minimize" })).toBeVisible();
  await expect(page.getByText("Sign in required")).toBeVisible();
});

test("floating Shenute assistant labels dictionary context", async ({
  page,
}) => {
  await page.goto("/en/dictionary");

  await page.getByRole("button", { name: "Open Shenute AI" }).click();

  await expect(page.getByText("Page context: Dictionary")).toBeVisible({
    timeout: FLOATING_ASSISTANT_TIMEOUT_MS,
  });
});

test("floating Shenute assistant is hidden on the Shenute route", async ({
  page,
}) => {
  await page.goto("/shenute");

  await expect(
    page.getByRole("heading", {
      name: "Shenute AI",
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open Shenute AI" }),
  ).toHaveCount(0);
});

test("legacy dictionary route redirects to the localized dictionary page", async ({
  page,
}) => {
  await page.goto("/dictionary");

  await expect(page).toHaveURL(/\/en\/dictionary$/);
  await expect(
    page.getByRole("heading", { name: "Coptic Dictionary" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Coptic, English, Greek")).toBeVisible();
});

test("legacy grammar route redirects to the localized grammar page", async ({
  page,
}) => {
  await page.goto("/grammar");

  await expect(page).toHaveURL(/\/en\/grammar$/);
  await expect(
    page.getByRole("heading", { name: "Coptic Grammar" }),
  ).toBeVisible();
  await expect(page.getByText("Lesson 01")).toBeVisible();
});

test("dashboard redirects unauthenticated visitors to login", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?/);

  const url = new URL(page.url());
  expect(url.pathname).toBe("/login");
  expect(url.searchParams.get("redirect_to")).toBe("/dashboard");
});

test("localized dashboard redirects unauthenticated visitors to login with locale preserved", async ({
  page,
}) => {
  await page.goto("/nl/dashboard");
  await expect(page).toHaveURL(/\/login\?/);

  const url = new URL(page.url());
  expect(url.pathname).toBe("/login");
  expect(url.searchParams.get("redirect_to")).toBe("/nl/dashboard");
});

test("login page honors the Dutch language preference", async ({ page }) => {
  await page.context().addCookies([DUTCH_LANGUAGE_COOKIE]);
  await page.goto("/login");

  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await expect(
    page.getByRole("heading", { name: "Welkom bij Coptic Compass" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Wachtwoord vergeten?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Inloggen met Google" }),
  ).toBeVisible();
});

test("forgot-password page honors the Dutch language preference", async ({
  page,
}) => {
  await page.context().addCookies([DUTCH_LANGUAGE_COOKIE]);
  await page.goto("/forgot-password");

  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await expect(
    page.getByRole("heading", { name: "Wachtwoord opnieuw instellen" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Resetlink verzenden" }),
  ).toBeVisible();
});

test("privacy route honors the Dutch language preference", async ({ page }) => {
  await page.context().addCookies([DUTCH_LANGUAGE_COOKIE]);
  await page.goto("/privacy");

  await expect(page).toHaveURL(/\/nl\/privacy$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await expect(
    page.getByRole("heading", { name: "Privacybeleid" }),
  ).toBeVisible();
});

test("terms route honors the Dutch language preference", async ({ page }) => {
  await page.context().addCookies([DUTCH_LANGUAGE_COOKIE]);
  await page.goto("/terms");

  await expect(page).toHaveURL(/\/nl\/terms$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await expect(
    page.getByRole("heading", { name: "Gebruiksvoorwaarden" }),
  ).toBeVisible();
});

test("grammar API index responds with the published dataset metadata", async ({
  request,
}) => {
  const response = await request.get("/api/v1/grammar");

  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  expect(payload.name).toBe("Coptic Compass Grammar API");
  expect(payload.apiBasePath).toBe("/api/v1/grammar");
  expect(payload.lessonCounts.published).toBeGreaterThan(0);
});
