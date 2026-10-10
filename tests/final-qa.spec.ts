import { test, expect } from '@playwright/test';

test.describe('GIS Integrity & Final Release-Gate Screenshot Suite', () => {
  test('Capture Final High-Fidelity GIS Alignment and Workflow States', async ({ page }) => {
    // 1. Full Desktop Overview (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/DigOnce/);

    // Wait for Leaflet map canvas and GIS layer controls to mount
    await page.waitForSelector('.leaflet-container', { state: 'visible' });
    await page.waitForSelector('[data-testid="gis-layer-control"]', { state: 'visible' });
    await page.waitForSelector('.leaflet-tile-loaded', { state: 'attached', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(3000); // Allow tiles and vector layers to settle

    // 1. Full Desktop Overview
    await page.screenshot({
      path: 'artifacts/ui-review/gis-realism/final/01-full-desktop-overview.png',
      fullPage: false,
    });

    // 2. Close-up of a Project Segment Over a Real Road (Anna Salai GCC Project)
    const projectCard = page.getByTestId('project-card-PRJ-2026-GCC-041');
    await expect(projectCard).toBeVisible();
    await projectCard.click();
    await expect(page.getByTestId('detail-inspector')).toBeVisible();
    await page.waitForTimeout(2000); // Wait for camera flyTo to settle

    // 2. Close-up of Project Segment
    await page.screenshot({
      path: 'artifacts/ui-review/gis-realism/final/02-project-segment-real-road.png',
      fullPage: false,
    });

    // 3. Selected Conflict Showing the Precise Overlap
    await page.click('text=Inspect Conflict →');
    await expect(page.getByTestId('detail-inspector')).toContainText('CONCURRENT_WORK_COLLISION');
    await page.waitForTimeout(2000); // Wait for camera flyTo to settle

    // 3. Selected Conflict Shared Overlap
    await page.screenshot({
      path: 'artifacts/ui-review/gis-realism/final/03-selected-conflict-precise-overlap.png',
      fullPage: false,
    });

    // 4. Broader Corridor Context
    await page.click('button[title="Reset to full corridor extent"]');
    await page.waitForTimeout(2000);

    // 4. Broader Corridor Context
    await page.screenshot({
      path: 'artifacts/ui-review/gis-realism/final/04-broader-corridor-context.png',
      fullPage: false,
    });

    // 5. Mobile Layout (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(2000);

    // 5. Mobile Layout
    await page.screenshot({
      path: 'artifacts/ui-review/gis-realism/final/05-mobile-layout.png',
      fullPage: false,
    });
  });
});
