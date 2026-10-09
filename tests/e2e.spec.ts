import { test, expect } from '@playwright/test';

test.describe('DigOnce End-to-End Workflow Verification', () => {
  test('Full Discovery, Investigation, Coordination Action, and Persistence Journey', async ({ page }) => {
    // 1. Open the application
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/DigOnce/);

    // Verify initial layout elements
    await expect(page.locator('text=Demonstration Environment')).toBeVisible();
    await expect(page.locator('text=2 Repeat-Dig Conflicts')).toBeVisible();

    // 2. Search for a project
    const searchInput = page.locator('input[placeholder*="Search by title"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Anna Salai');

    // Confirm filtered results show Anna Salai projects
    await expect(page.getByTestId('project-card-PRJ-2026-GCC-041')).toBeVisible();
    await expect(page.getByTestId('project-card-PRJ-2026-CMWSSB-082')).toBeVisible();

    // 3. Select a project and verify inspector
    await page.getByTestId('project-card-PRJ-2026-GCC-041').click();
    const inspector = page.getByTestId('detail-inspector');
    await expect(inspector).toBeVisible();
    await expect(inspector).toContainText('Anna Salai Bitumen Milling & Resurfacing');
    await expect(inspector).toContainText('Southern Infrastructure Ltd');
    await expect(inspector).toContainText('20%–70%');

    // 4. Navigate to associated conflict
    const conflictLink = inspector.locator('text=Inspect Conflict →');
    await expect(conflictLink).toBeVisible();
    await conflictLink.click();

    // 5. Confirm Conflict Alerts tab is active and conflict inspector shows deterministic finding
    await expect(page.getByTestId('conflict-card-CNF-CONCURRENT-RD-CH-09-ANNA-01-PRJ-2026-CMWSSB-082-PRJ-2026-GCC-041')).toBeVisible();
    await expect(inspector).toContainText('CONCURRENT_WORK_COLLISION');
    await expect(inspector).toContainText('Coordinate joint trenching');

    // 6. Perform Coordination Action: Propose Joint Dig
    const proposeBtn = page.getByTestId('propose-coordination-btn');
    await expect(proposeBtn).toBeVisible();
    await proposeBtn.click();

    // 7. Verify displayed status updates to COORDINATION_PROPOSED
    await expect(inspector).toContainText('COORDINATION_PROPOSED');
    await expect(
      page
        .getByTestId('conflict-card-CNF-CONCURRENT-RD-CH-09-ANNA-01-PRJ-2026-CMWSSB-082-PRJ-2026-GCC-041')
        .locator('text=Proposed')
    ).toBeVisible();

    // 8. Refresh the page to test localStorage persistence
    await page.reload();
    await page.click('button:has-text("Conflict Alerts")');
    await page.getByTestId('conflict-card-CNF-CONCURRENT-RD-CH-09-ANNA-01-PRJ-2026-CMWSSB-082-PRJ-2026-GCC-041').click();
    await expect(page.getByTestId('detail-inspector')).toContainText('COORDINATION_PROPOSED');

    // 9. Test Filter by Agency and Category
    await page.click('button:has-text("Public Projects")');
    await searchInput.fill('');
    const agencySelect = page.locator('select').first();
    await agencySelect.selectOption('CMRL');
    await expect(page.getByTestId('project-card-PRJ-2026-CMRL-077')).toBeVisible();
    await expect(page.getByTestId('project-card-PRJ-2026-GCC-041')).toBeHidden();

    // 10. Test Empty State
    await searchInput.fill('NonexistentXYZRoad');
    await expect(page.locator('text=No public work projects match your filter criteria.')).toBeVisible();

    // 11. Clear selection and close inspector
    await searchInput.fill('');
    await agencySelect.selectOption('ALL');
    await page.getByTestId('project-card-PRJ-2026-GCC-041').click();
    await expect(page.getByTestId('detail-inspector')).toBeVisible();
    await page.getByTestId('close-inspector-btn').click();
    await expect(page.getByTestId('detail-inspector')).toBeHidden();

    // 12. Capture a screenshot for verification evidence
    await page.screenshot({ path: 'test-results/milestone4-browser-verification.png', fullPage: true });
  });
});
