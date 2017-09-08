import { ScreenshotTestPage } from './app.po';
const screenshot = require('../util/screenshot.js');

describe('screenshot-test App', function () {
  let page: ScreenshotTestPage;
  const self = this;

  beforeEach(() => {
    page = new ScreenshotTestPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
    screenshot.checkScreenshot(self, 'test');
  });
});
