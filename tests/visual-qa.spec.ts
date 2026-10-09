import { test, expect } from '@playwright/test';

test.describe('Visual QA Screenshot Capture Suite', () => {
  test('Capture All Required Visual States with Real Rendering and Network Tile Checks', async ({ page }) => {
    // 1. Monitor network for CartoDB / OSM tiles
    let tileLoadedCount = 0;
    page.on('response', (response) => {
      const url = response.url();
      if ((url.includes('basemaps.cartocdn.com') || url.includes('tile.openstreetmap.org')) && response.status() === 200) {
        tileLoadedCount++;
      }
    });

    // A. Desktop Overview: Set 1440x900 viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/DigOnce/);

    // Wait for Leaflet map to fully mount and render tiles
    await page.waitForSelector('.leaflet-container', { state: 'visible' });
    await page.waitForTimeout(3000); // Allow tile loading & animation to settle

    // Confirm that actual map tiles were loaded via HTTP 200
    expect(tileLoadedCount).toBeGreaterThan(0);

    // 1. Desktop Overview Screenshot
    await page.screenshot({
      path: 'artifacts/ui-review/01-desktop-overview.png',
      fullPage: false,
    });

    // 2. Selected Project: Click PRJ-2026-GCC-041 on Anna Salai
    const projectCard = page.getByTestId('project-card-PRJ-2026-GCC-041');
    await expect(projectCard).toBeVisible();
    await projectCard.click();
    await expect(page.getByTestId('detail-inspector')).toBeVisible();
    await page.waitForTimeout(1000); // Wait for flyTo animation

    // 2. Selected Project Screenshot
    await page.screenshot({
      path: 'artifacts/ui-review/02-selected-project.png',
      fullPage: false,
    });

    // 3. Conflict Investigation: Click the link inside inspector to view conflict
    await page.click('text=Inspect Conflict →');
    await expect(page.getByTestId('detail-inspector')).toContainText('CONCURRENT_WORK_COLLISION');
    await page.waitForTimeout(1000); // Wait for flyTo animation on conflict subsegment

    // 3. Conflict Investigation Screenshot
    await page.screenshot({
      path: 'artifacts/ui-review/03-conflict-investigation.png',
      fullPage: false,
    });

    // 4. Coordination Action: Click "Propose Joint Dig"
    const proposeBtn = page.getByTestId('propose-coordination-btn');
    await expect(proposeBtn).toBeVisible();
    await proposeBtn.click();
    await expect(page.getByTestId('detail-inspector')).toContainText('COORDINATION_PROPOSED');
    await page.waitForTimeout(500);

    // 4. Coordination Action Screenshot
    await page.screenshot({
      path: 'artifacts/ui-review/04-coordination-action.png',
      fullPage: false,
    });

    // 5. Empty State: Search for nonexistent street query
    await page.click('button:has-text("Public Projects")');
    const searchInput = page.locator('input[placeholder*="Search by title"]');
    await searchInput.fill('NonexistentXYZLocation');
    await expect(page.locator('text=No public work projects match your filter criteria.')).toBeVisible();
    await page.waitForTimeout(500);

    // 5. Empty State Screenshot
    await page.screenshot({
      path: 'artifacts/ui-review/05-empty-state.png',
      fullPage: false,
    });

    // 6. Mobile Layout: 390 x 844 viewport (iPhone 13/14/15 size)
    await searchInput.fill(''); // Clear search
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1500);

    // 6. Mobile Layout Screenshot
    await page.screenshot({
      path: 'artifacts/ui-review/06-mobile-layout.png',
      fullPage: false,
    });
  });
});
