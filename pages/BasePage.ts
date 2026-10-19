import type { Page } from 'playwright';

export abstract class BasePage {
  protected readonly page: Page;

  // Path relative to BASE_URL, used to open the page and to check we're on it
  abstract readonly path: string;

  constructor(page: Page) {
    this.page = page;
  }

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }
}
