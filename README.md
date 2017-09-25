# ScreenshotTest

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.2.7.

## How to use

Add in `protractor.conf.js` config json the following setting:

```javascript
    params: {
        screenshotsBasePath: 'screenshots',
        browserFolderName: '{browserName}', // can be used the following variables: browserName, platform, version
        screenshotSizes: [{
                browserName: 'phantomjs',
                sizes: [
                    { width: 1024, height: 768 }, // default, iPad portait
                    { width: 320, height: 480 }, // iPhone portrait
                    { width: 768, height: 1024 } // iPad landscape
                ]
            },
            {
                browserName: 'chrome',
                sizes: [
                    { width: 1024, height: 768 }, // default
                    { width: 320, height: 480 }, // iPhone portrait
                    { width: 768, height: 1024 } // iPad landscape
                ]
            }
        ]
    },
```

in `*.e2e-spec.ts` use it:

```typescript
import { ExamplePage } from './app.po';
const screenshot = require('ngular-e2e-screenshot');

describe('example App', function() {
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
```

Please pay atention that in the `description` function is passed a closure (`function(){...}`) rather than an arrow function (`() => {...}`). This is done to pass test object to screenshot.
