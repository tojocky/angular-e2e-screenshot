import { ScreenshotTestPage } from './app.po';

describe('screenshot-test App', () => {
  let page: ScreenshotTestPage;

  beforeEach(() => {
    page = new ScreenshotTestPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
