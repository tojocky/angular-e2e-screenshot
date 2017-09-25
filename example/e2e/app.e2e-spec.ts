import { ExamplePage } from './app.po';
const screenshot = require('../../src/index.js');

describe('example App', function () {
  let page: ExamplePage;
  let self = this;

  beforeEach(() => {
    page = new ExamplePage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
    screenshot.checkScreenshot(self, 'test');
  });
});
