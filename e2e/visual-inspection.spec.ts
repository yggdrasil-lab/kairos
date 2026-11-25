import { test, expect, devices } from '@playwright/test';
import { setupKairosMockApi } from './helpers/mock-data';

const PLATFORMS = [
  {
    name: 'ios',
    options: {
      viewport: devices['iPhone 14'].viewport,
      userAgent: devices['iPhone 14'].userAgent,
      deviceScaleFactor: devices['iPhone 14'].deviceScaleFactor,
      isMobile: devices['iPhone 14'].isMobile,
      hasTouch: devices['iPhone 14'].hasTouch,
    },
  },
  {
    name: 'android',
    options: {
      viewport: devices['Pixel 7'].viewport,
      userAgent: devices['Pixel 7'].userAgent,
      deviceScaleFactor: devices['Pixel 7'].deviceScaleFactor,
      isMobile: devices['Pixel 7'].isMobile,
      hasTouch: devices['Pixel 7'].hasTouch,
    },
  },
  {
    name: 'desktop',
    options: {
      viewport: { width: 1280, height: 800 },
      isMobile: false,
      hasTouch: false,
    },
  },
];

for (const { name: platform, options } of PLATFORMS) {
  test.describe(`Kairos Visual Inspection - ${platform.toUpperCase()}`, () => {
    test.use({ ...options });

    test.beforeEach(async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-11-25T09:30:00+13:00'));
      await setupKairosMockApi(page);
      await page.goto('/');
    });

    test(`captures Focus Cockpit, Today, Week, Cues & Reflection, and pinned modals on ${platform}`, async ({ page }) => {
      test.setTimeout(60000);

      await expect.poll(async () => {
        return await page.getByTestId('now-next-hero').isVisible();
      }).toBe(true);

      const themeTokens = await page.evaluate(() => {
        const root = document.documentElement;
        const styles = getComputedStyle(root);
        return {
          theme: root.dataset.theme,
          accent: styles.getPropertyValue('--ui-accent').trim(),
          radiusCard: styles.getPropertyValue('--ui-radius-card').trim(),
        };
      });
      expect(themeTokens.theme).toBe('kairos');
      expect(themeTokens.accent).toBe('196 181 253');
      expect(themeTokens.radiusCard).toBe('22px');

      await expect(page.getByTestId('now-next-hero')).toContainText('Wednesday Deep Work');
      await expect(page.getByTestId('now-next-hero')).toContainText('<15m Tail Suppressed');
      await expect(page.getByTestId('now-next-upcoming')).toContainText('Design Review Sync');
      await expect(page.getByTestId('active-zone-chain-card')).toBeVisible();
      await expect(page.getByTestId('active-zone-chain-card')).toContainText('Kitchen -> Desk');
      await expect(page.getByTestId('active-zone-chain-card')).toContainText('Fill water bottle at kitchen bench');

      await page.screenshot({
        path: `screenshots/${platform}/01-now-cockpit.png`,
        fullPage: platform === 'desktop',
        animations: 'disabled',
      });

      await page.getByTestId('cue-log-friction-1').click();
      await expect(page.getByRole('heading', { name: 'Log Friction Observation' })).toBeVisible();
      await page.getByTestId('friction-note-input').fill('Headphones battery flat at desk');

      if (platform === 'ios') {
        const frictionBox = await page.getByTestId('friction-submit-btn').boundingBox();
        expect(frictionBox).not.toBeNull();
        expect((frictionBox?.y ?? 999) + (frictionBox?.height ?? 0)).toBeLessThanOrEqual(844);
      }

      await page.screenshot({
        path: `screenshots/${platform}/05-log-friction-modal.png`,
        animations: 'disabled',
      });

      await page.getByTestId('friction-submit-btn').click();
      await expect(page.getByRole('heading', { name: 'Log Friction Observation' })).toBeHidden();

      if (platform !== 'desktop') {
        await page.getByRole('button', { name: 'Today' }).click();
      }

      await expect.poll(async () => {
        return await page.getByTestId('today-timeline').isVisible();
      }).toBe(true);

      await expect(page.getByTestId('all-day-commitments')).toContainText('Release Freeze Window');
      await expect(page.getByTestId('today-timeline')).toContainText('Conflict');

      await page.screenshot({
        path: `screenshots/${platform}/02-today-timeline.png`,
        fullPage: platform === 'desktop',
        animations: 'disabled',
      });

      if (platform === 'desktop') {
        await page.getByTestId('desktop-tab-week').click();
        await expect(page.getByTestId('weekly-grid-desktop')).toBeVisible();
      } else {
        await page.getByRole('button', { name: 'Week' }).click();
        await expect(page.getByTestId('weekly-grid-mobile')).toBeVisible();
        await page.getByTestId('week-day-pill-0').click();
        await expect(page.getByTestId('weekly-grid-mobile')).toContainText('Monday Deep Work');

        const hasHorizontalOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1
        );
        expect(hasHorizontalOverflow).toBe(false);
      }

      await page.screenshot({
        path: `screenshots/${platform}/03-weekly-grid.png`,
        fullPage: platform === 'desktop',
        animations: 'disabled',
      });

      if (platform === 'desktop') {
        await page.getByTestId('desktop-tab-cues').click();
      } else {
        await page.getByRole('button', { name: 'Cues' }).click();
      }
      await expect(page.getByTestId('cue-catalog-view')).toBeVisible();
      await expect(page.getByTestId('cue-catalog-view')).toContainText('Kitchen -> Desk');

      await page.screenshot({
        path: `screenshots/${platform}/06-cues-catalog.png`,
        fullPage: platform === 'desktop',
        animations: 'disabled',
      });

      await page.getByTestId('cues-subtab-reflection').click();
      await expect(page.getByTestId('weekly-reflection-view')).toBeVisible();
      await expect(page.getByTestId('weekly-reflection-view')).toContainText('Headphones battery flat at desk');

      await page.screenshot({
        path: `screenshots/${platform}/07-weekly-reflection.png`,
        fullPage: platform === 'desktop',
        animations: 'disabled',
      });

      await page.getByTestId('header-add-btn').click();
      await expect(page.getByRole('heading', { name: 'Add Commitment' })).toBeVisible();
      await page.getByTestId('commitment-title-input').fill('Afternoon Sync');
      await page.getByTestId('commitment-start-input').fill('13:00');
      await page.getByTestId('commitment-end-input').fill('13:45');

      if (platform === 'ios') {
        const commitmentBox = await page.getByTestId('commitment-submit-btn').boundingBox();
        expect(commitmentBox).not.toBeNull();
        expect((commitmentBox?.y ?? 999) + (commitmentBox?.height ?? 0)).toBeLessThanOrEqual(844);
      }

      await page.screenshot({
        path: `screenshots/${platform}/04-add-commitment-modal.png`,
        animations: 'disabled',
      });

      await page.getByTestId('commitment-submit-btn').click();
      await expect(page.getByRole('heading', { name: 'Add Commitment' })).toBeHidden();

      if (platform === 'desktop') {
        await page.getByTestId('desktop-tab-today').click();
      } else {
        await page.getByRole('button', { name: 'Today' }).click();
      }

      await expect.poll(async () => {
        const text = await page.getByTestId('today-timeline').textContent();
        return text?.includes('Afternoon Sync') ?? false;
      }).toBe(true);
    });
  });
}
