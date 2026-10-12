import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

async function expectAccessible(page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(violations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
  }))).toEqual([])
}

test('guest creates a room and edits are shared with a second browser page', async ({ page, context }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start coding' }).click()
  await expect(page.getByRole('heading', { name: /make it work/i })).toBeVisible()
  await expect(page.getByText('Room connected')).toBeVisible()
  await expectAccessible(page)

  const roomPath = new URL(page.url()).pathname
  expect(roomPath).toMatch(/^\/r\/[A-Za-z0-9]{6}$/)

  const collaborator = await context.newPage()
  await collaborator.goto(roomPath)
  await expect(collaborator.getByText('Room connected')).toBeVisible()

  const editor = page.locator('.cm-content[contenteditable="true"]')
  const collaboratorEditor = collaborator.locator('.cm-content[contenteditable="true"]')
  await expect(editor).toBeVisible()
  await editor.click()
  await editor.press('Control+A')
  await editor.pressSequentially('const shared = true;')
  await expect(collaboratorEditor).toContainText('const shared = true;', { timeout: 10_000 })
})

test('join form explains invalid room codes', async ({ page }) => {
  await page.goto('/join')
  await page.getByLabel('Room code or link').fill('bad')
  await page.getByRole('button', { name: 'Open shared editor' }).click()
  await expect(page.getByRole('alert')).toContainText('6-character room code')
})

test('a new user can sign up and sign out', async ({ page }) => {
  const username = `e2e${Date.now()}`
  await page.goto('/auth')
  await page.getByRole('button', { name: 'Create an account' }).click()
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Email').fill(`${username}@example.test`)
  await page.getByLabel('Password').fill('TestPass123')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
})

test('landing, join, and auth pages have no axe WCAG A or AA violations', async ({ page }) => {
  await page.goto('/')
  await expectAccessible(page)

  await page.goto('/join')
  await expectAccessible(page)

  await page.goto('/auth')
  await expectAccessible(page)
})
