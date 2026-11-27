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
      await page.goto('/?tab=now');
    });

    test(`captures Focus Cockpit, Today, Week, Cues & Reflection, and pinned modals on ${platform}`, async ({ page }) => {
      test.setTimeout(60000);

      const swResponse = await page.request.get('/sw.js');
      expect(swResponse.status()).toBe(200);
      const swBody = await swResponse.text();
      expect(swBody).toContain('showNotification');
      expect(swBody).toContain('notificationclick');
      expect(swBody).toContain('open-now');
      expect(swBody).toContain('/?tab=now');
      expect(swBody).not.toContain("addEventListener('fetch'");

      await expect.poll(async () => {
        return await page.getByTestId('now-next-hero').isVisible();
      }).toBe(true);

      await expect(page.getByTestId('header-push-btn')).toBeVisible();

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
      const nowFastingPill = page.getByTestId('now-next-hero').getByTestId('fasting-suggestion-pill');
      await expect(nowFastingPill).toBeVisible();
      await expect(nowFastingPill).toContainText('Fasting');
      await expect(nowFastingPill).toContainText('14:10 · 10:30 - 20:30');
      await expect(nowFastingPill).toContainText('Opens 10:30');
      await expect(nowFastingPill.locator('button')).toHaveCount(0);
      await expect(page.getByTestId('now-next-upcoming')).toContainText('Design Review Sync');
      await expect(page.getByTestId('active-zone-chain-card')).toBeVisible();
      await expect(page.getByTestId('active-zone-chain-card')).toContainText('Kitchen -> Desk');
      await expect(page.getByTestId('active-zone-chain-card')).toContainText('Step on scale beside bathroom door');
      await expect(page.getByTestId('active-zone-chain-card').getByTestId('passive-signal-observed')).toContainText('Weighed in 07:15 (72.4 kg)');
      await expect(page.getByTestId('active-zone-chain-card')).toContainText('Fasted Walk 40m (Eir)');
      await expect(page.getByTestId('active-zone-chain-card')).not.toContainText(/missed|streak/i);
      await expect(page.getByTestId('tentative-review-strip')).toContainText('Tentative from Iris');
      await expect(page.getByTestId('tentative-review-strip')).toContainText('Flight NZ502 to Wellington');
      await expect(page.getByTestId('tentative-review-strip')).toContainText('Dentist Checkup');

      await page.screenshot({
        path: `screenshots/${platform}/01-now-cockpit.png`,
        fullPage: platform === 'desktop',
        animations: 'disabled',
      });

      await page.getByTestId('extend-15m-btn').click();
      await expect(page.getByTestId('now-next-hero')).toContainText('Extended x1');
      await expect(page.getByTestId('now-next-hero')).toContainText('09:00 - 10:15');
      await page.getByTestId('extend-15m-btn').click();
      await expect(page.getByTestId('now-next-hero')).toContainText('Extended x2');
      await expect(page.getByTestId('extend-cap-pill')).toContainText('Extend cap reached (2/2)');
      await expect(page.getByTestId('extend-15m-btn')).toBeHidden();

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
      const todayFastingPill = page.getByTestId('all-day-commitments').getByTestId('fasting-suggestion-pill');
      await expect(todayFastingPill).toBeVisible();
      await expect(todayFastingPill).toContainText('Fasting');
      await expect(todayFastingPill).toContainText('14:10 · 10:30 - 20:30');
      await expect(todayFastingPill).toContainText('Opens 10:30');
      await expect(todayFastingPill.locator('button')).toHaveCount(0);
      await expect(page.getByTestId('all-day-item-105')).toContainText('Flight NZ502 to Wellington');
      await expect(page.getByTestId('all-day-item-105')).toContainText('Tentative');
      await expect(page.getByTestId('timeline-slice-commitment-106')).toContainText('Dentist Checkup');
      await expect(page.getByTestId('timeline-slice-commitment-106')).toContainText('Tentative');
      await expect(page.getByTestId('today-timeline')).toContainText('Conflict');

      const hydratedWorkoutSlice = page.getByTestId('timeline-slice-grid-4-0');
      await expect(hydratedWorkoutSlice.getByTestId('hydrated-workout-badge')).toContainText('Kratos: Lower Strength & Mobility');

      const kratosSessionSlice = page.getByTestId('timeline-slice-commitment-103');
      await expect(kratosSessionSlice).toContainText('Morning Swim (Kratos)');
      await expect(kratosSessionSlice).toContainText('Kratos');
      await expect(kratosSessionSlice.getByRole('button', { name: /edit/i })).toHaveCount(0);
      await expect(kratosSessionSlice.getByRole('button', { name: /delete/i })).toHaveCount(0);

      await page.screenshot({
        path: `screenshots/${platform}/02-today-timeline.png`,
        fullPage: platform === 'desktop',
        animations: 'disabled',
      });

      const weekGrid =
        platform === 'desktop'
          ? page.getByTestId('weekly-grid-desktop')
          : page.getByTestId('weekly-grid-mobile');

      if (platform === 'desktop') {
        await page.getByTestId('desktop-tab-week').click();
        await expect(weekGrid).toBeVisible();
        await expect(weekGrid.getByTestId('week-column-2').getByTestId('week-now-line')).toBeVisible();
      } else {
        await page.getByRole('button', { name: 'Week' }).click();
        await expect(weekGrid).toBeVisible();
        await expect(weekGrid.getByTestId('week-now-line')).toBeVisible();
        await page.getByTestId('week-day-pill-0').click();
        await expect(weekGrid).toContainText('Monday Deep Work');

        const hasHorizontalOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1
        );
        expect(hasHorizontalOverflow).toBe(false);
      }

      await expect(weekGrid).toContainText('07:00');
      await expect(weekGrid).toContainText('12:00');
      await expect(weekGrid).toContainText('18:00');
      await expect(weekGrid.locator('[data-testid^="week-gap-"]').first()).toBeVisible();
      await expect(weekGrid.getByTestId('grid-block-9')).toContainText('Midday Reset');

      const earlierBox = await weekGrid.getByTestId('grid-block-1').boundingBox();
      const laterBox = await weekGrid.getByTestId('grid-block-9').boundingBox();
      expect(earlierBox).not.toBeNull();
      expect(laterBox).not.toBeNull();
      expect(laterBox!.y).toBeGreaterThan(earlierBox!.y + earlierBox!.height + 20);

      await page.screenshot({
        path: `screenshots/${platform}/03-weekly-grid.png`,
        fullPage: platform === 'desktop',
        animations: 'disabled',
      });

      await weekGrid.getByTestId('week-gap-0-720').click();
      await expect(page.getByRole('heading', { name: 'Add Weekly Grid Block' })).toBeVisible();
      await expect(page.getByTestId('grid-block-start-input')).toHaveValue('12:00');
      await expect(page.getByTestId('grid-block-end-input')).toHaveValue('13:00');
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByTestId('grid-block-start-input')).toBeHidden();

      await page.getByTestId('add-grid-block-btn').click();
      await expect(page.getByTestId('grid-block-flexible-toggle')).toBeVisible();
      await page.getByTestId('grid-block-flexible-toggle').click();
      await expect(page.getByTestId('grid-block-flexible-toggle')).toContainText('Flexible (Trim on Extend)');
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByTestId('grid-block-flexible-toggle')).toBeHidden();

      if (platform === 'desktop') {
        await page.getByTestId('desktop-tab-cues').click();
      } else {
        await page.getByRole('button', { name: 'Cues' }).click();
      }
      await expect(page.getByTestId('cue-catalog-view')).toBeVisible();
      await expect(page.getByTestId('cue-catalog-view')).toContainText('Kitchen -> Desk');
      await expect(page.getByTestId('cue-catalog-view').getByTestId('passive-signal-observed')).toHaveCount(2);
      await expect(page.getByTestId('cue-catalog-view')).toContainText('Weighed in 07:15 (72.4 kg)');
      await expect(page.getByTestId('cue-catalog-view')).toContainText('Swim 1500m logged');
      await expect(page.getByTestId('cue-catalog-view')).toContainText('Fasted Walk 40m (Eir)');
      await expect(page.getByTestId('cue-catalog-view')).toContainText('Monthly Financial Check-in (Plutus)');
      for (const cueId of [1, 2, 3, 4]) {
        await expect(page.getByTestId(`habit-cue-${cueId}`)).not.toContainText(/missed|streak/i);
      }

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
      await expect(page.getByTestId('commitment-nudge-select')).toHaveValue('two-stage');
      await expect(page.getByTestId('commitment-urgent-bypass-toggle')).toBeVisible();
      await page.getByTestId('commitment-allday-toggle').click();
      await expect(page.getByTestId('commitment-urgent-bypass-toggle')).toBeHidden();
      await page.getByTestId('commitment-allday-toggle').click();
      await expect(page.getByTestId('commitment-urgent-bypass-toggle')).toBeVisible();
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

    test(`verifies active workout hydration and day-header fallback pill on ${platform}`, async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-11-25T09:30:00+13:00'));
      await setupKairosMockApi(page, { activeWorkoutNow: true, dayHeaderFallback: true });
      await page.goto('/?tab=now');

      await expect(page.getByTestId('now-next-hero')).toContainText('Morning Workout');
      await expect(page.getByTestId('now-next-hero').getByTestId('hydrated-workout-badge')).toContainText(
        'Kratos: Lower Strength & Mobility'
      );
      await expect(page.getByTestId('now-next-hero').getByTestId('kratos-day-header-pill')).toContainText(
        'Upper Push Focus'
      );

      if (platform !== 'desktop') {
        await page.getByRole('button', { name: 'Today' }).click();
      }
      await expect(page.getByTestId('all-day-commitments').getByTestId('kratos-day-header-pill')).toContainText(
        'Upper Push Focus'
      );
    });

    test(`verifies tentative commitment confirm, edit-confirm, and dismiss controls on ${platform}`, async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-11-25T09:30:00+13:00'));
      await setupKairosMockApi(page);
      await page.goto('/?tab=now');

      await expect(page.getByTestId('tentative-review-strip')).toContainText('Flight NZ502 to Wellington');
      await expect(page.getByTestId('tentative-review-strip')).toContainText('Dentist Checkup');

      const confirmPatchPromise = page.waitForRequest(
        (req) => req.url().includes('/api/commitments/105') && req.method() === 'PATCH'
      );
      await page.getByTestId('strip-tentative-confirm-105').click();
      const confirmReq = await confirmPatchPromise;
      expect(confirmReq.postDataJSON()).toEqual({ tentative: false });
      await expect(page.getByTestId('tentative-strip-item-105')).toHaveCount(0);

      if (platform !== 'desktop') {
        await page.getByRole('button', { name: 'Today' }).click();
      }
      await expect(page.getByTestId('all-day-item-105')).not.toContainText('Tentative');

      if (platform !== 'desktop') {
        await page.getByRole('button', { name: 'Now' }).click();
      }
      await page.getByTestId('strip-tentative-edit-106').click();
      await expect(page.getByTestId('commitment-tentative-banner')).toContainText('Tentative commitment');
      await expect(page.getByTestId('commitment-submit-btn')).toContainText('Save & Confirm');
      await page.getByTestId('commitment-title-input').fill('Dentist Checkup Confirmed');

      const editPatchPromise = page.waitForRequest(
        (req) => req.url().includes('/api/commitments/106') && req.method() === 'PATCH'
      );
      await page.getByTestId('commitment-submit-btn').click();
      const editReq = await editPatchPromise;
      expect(editReq.postDataJSON()).toMatchObject({
        title: 'Dentist Checkup Confirmed',
        tentative: false,
      });
      await expect(page.getByTestId('tentative-review-strip')).toHaveCount(0);

      if (platform !== 'desktop') {
        await page.getByRole('button', { name: 'Today' }).click();
      }
      await expect(page.getByTestId('timeline-slice-commitment-106')).toContainText('Dentist Checkup Confirmed');
      await expect(page.getByTestId('timeline-slice-commitment-106')).not.toContainText('Tentative');
    });

    test(`verifies active/next tentative inline controls and 1-tap dismiss on ${platform}`, async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-11-25T09:30:00+13:00'));
      await setupKairosMockApi(page, { activeTentativeNow: true, tentativeNext: true });
      await page.goto('/?tab=now');

      await expect(page.getByTestId('now-next-hero')).toContainText('Physio Assessment');
      await expect(page.getByTestId('active-tentative-confirm-107')).toBeVisible();
      await expect(page.getByTestId('active-tentative-edit-107')).toBeVisible();
      await expect(page.getByTestId('active-tentative-dismiss-107')).toBeVisible();

      await expect(page.getByTestId('now-next-upcoming')).toContainText('Design Review Sync');
      await expect(page.getByTestId('next-tentative-confirm-102')).toBeVisible();
      await expect(page.getByTestId('next-tentative-edit-102')).toBeVisible();
      await expect(page.getByTestId('next-tentative-dismiss-102')).toBeVisible();

      const dismissActivePromise = page.waitForRequest(
        (req) => req.url().includes('/api/commitments/107') && req.method() === 'DELETE'
      );
      await page.getByTestId('active-tentative-dismiss-107').click();
      await dismissActivePromise;
      await expect(page.getByTestId('now-next-hero')).not.toContainText('Physio Assessment');

      if (platform !== 'desktop') {
        await page.getByRole('button', { name: 'Today' }).click();
      }
      await expect(page.getByTestId('timeline-slice-commitment-107')).toHaveCount(0);

      const dismissAllDayPromise = page.waitForRequest(
        (req) => req.url().includes('/api/commitments/105') && req.method() === 'DELETE'
      );
      await page.getByTestId('timeline-tentative-dismiss-105').click();
      await dismissAllDayPromise;
      await expect(page.getByTestId('all-day-item-105')).toHaveCount(0);
    });

    test(`verifies optional Friday 18:6 fasting pill and phase variants on ${platform}`, async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-11-27T09:30:00+13:00'));
      await setupKairosMockApi(page, {
        fastingSuggestion: {
          protocol: '18:6',
          window_start: '14:30',
          window_end: '20:30',
          phase: 'fasting',
          is_optional_reset: true,
          reason: 'Optional Friday 18:6 reset window on rest day with green vitals',
        },
      });
      await page.goto('/?tab=now');

      const nowPill = page.getByTestId('now-next-hero').getByTestId('fasting-suggestion-pill');
      await expect(nowPill).toBeVisible();
      await expect(nowPill).toContainText('Fasting');
      await expect(nowPill).toContainText('Optional 18:6 · 14:30 - 20:30');
      await expect(nowPill).toContainText('Opens 14:30');
      await expect(nowPill.locator('button')).toHaveCount(0);

      if (platform !== 'desktop') {
        const hasHorizontalOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1
        );
        expect(hasHorizontalOverflow).toBe(false);
        await page.getByRole('button', { name: 'Today' }).click();
      }
      const todayPill = page.getByTestId('all-day-commitments').getByTestId('fasting-suggestion-pill');
      await expect(todayPill).toBeVisible();
      await expect(todayPill).toContainText('Optional 18:6 · 14:30 - 20:30');
      await expect(todayPill.locator('button')).toHaveCount(0);

      await page.unroute('**/api/**');
      await setupKairosMockApi(page, {
        fastingSuggestion: {
          protocol: '14:10',
          window_start: '10:30',
          window_end: '20:30',
          phase: 'eating',
          is_optional_reset: false,
          reason: 'Inside 14:10 eating window',
        },
      });
      await page.goto('/?tab=now');
      const eatingPill = page.getByTestId('now-next-hero').getByTestId('fasting-suggestion-pill');
      await expect(eatingPill).toContainText('Eating');
      await expect(eatingPill).toContainText('14:10 · 10:30 - 20:30');
      await expect(eatingPill).toContainText('Closes 20:30');

      await page.unroute('**/api/**');
      await setupKairosMockApi(page, {
        fastingSuggestion: {
          protocol: '14:10',
          window_start: '10:30',
          window_end: '20:30',
          phase: 'closed',
          is_optional_reset: false,
          reason: 'Kitchen closed after 20:30',
        },
      });
      await page.goto('/?tab=now');
      const closedPill = page.getByTestId('now-next-hero').getByTestId('fasting-suggestion-pill');
      await expect(closedPill).toContainText('Closed');
      await expect(closedPill).toContainText('14:10 · 10:30 - 20:30');
      await expect(closedPill).toContainText('Kitchen closed');
    });
  });
}
