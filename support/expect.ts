import { expect as baseExpect } from '@playwright/test';
import { config } from '../config/config';

// Web-first assertions: expect(locator).toHaveText(...) keeps retrying until it passes
// or EXPECT_TIMEOUT runs out. This is what replaces sleeps in the steps.
export const expect = baseExpect.configure({ timeout: config.expectTimeout });
