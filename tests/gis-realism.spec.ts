import { test, expect } from '@playwright/test';

test.describe('GIS Realism Screenshot Capture Suite', () => {
  test('Capture Real Road Alignment, Shared Overlap, Broad Context, and Layer Toggles', async ({ page }) => {
    let tileLoadedCount = 0;
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('tile.openstreetmap.org') && response.status() === 200) {
        tileLoadedCount++;
      }
    });

    // 1. Full Desktop GIS Overview (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/DigOnce/);

    // Wait for Leaflet map and layer controls
    await page.waitForSelector('.leaflet-container', { state: 'visible' });
    await page.waitForSelector('[data-testid="gis-layer-control"]', { state: 'visible' });
    await page.waitForTimeout(3000); // Allow tiles to settle

    expect(tileLoadedCount).toBeGreaterThan(0);

    // Screenshot 1: Full desktop GIS overview with layer controls, scale bar, and legend
    await page.screenshot({
      path: 'artifacts/ui-review/gis-realism/01-full-desktop-gis-overview.png',
      fullPage: false,
    });

    // 2. A Road with Simulated Work Segment Following Actual Geometry (Anna Salai)
    const projectCard = page.getByTestId('project-card-PRJ-2026-GCC-041');
    await expect(projectCard).toBeVisible();
    await projectCard.click();
    await expect(page.getByTestId('detail-inspector')).toBeVisible();
    await page.waitForTimeout(1500); // Wait for camera zoom & pan to settle

    // Screenshot 2: Work segment tracing real curved street centerline
    await page.screenshot({
      path: 'artifacts/ui-review/gis-realism/02-work-segment-real-geometry.png',
      fullPage: false,
    });

    // 3. A Selected Conflict Showing the Shared Subsegment (Anna Salai Conflict)
    await page.click('text=Inspect Conflict →');
    await expect(page.getByTestId('detail-inspector')).toContainText('CONCURRENT_WORK_COLLISION');
    await page.waitForTimeout(1500); // Wait for camera focus

    // Screenshot 3: Shared subsegment overlap (40%-70%) with warning casing
    await page.screenshot({
      path: 'artifacts/ui-review/gis-realism/03-selected-conflict-shared-subsegment.png',
      fullPage: false,
    });

    // 4. Broader Geographic View Establishing Chennai-Kancheepuram Context
    // Click "Reset Extent" in GIS Layer Control
    await page.click('button[title="Reset to full corridor extent"]');
    await page.waitForTimeout(1500);

    // Screenshot 4: Broad corridor context (Chennai metro down to Kancheepuram town)
    await page.screenshot({
      path: 'artifacts/ui-review/gis-realism/04-chennai-kancheepuram-corridor-context.png',
      fullPage: false,
    });

    // 5. Mobile View Showing That Map Remains Usable
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1500);

    // Screenshot 5: Mobile viewport with accessible map, legend, and inspector
    await page.screenshot({
      path: 'artifacts/ui-review/gis-realism/05-mobile-usable-gis-view.png',
      fullPage: false,
    });
  });
});
