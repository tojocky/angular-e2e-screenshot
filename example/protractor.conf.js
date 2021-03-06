// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');

exports.config = {
    allScriptsTimeout: 11000,
    specs: [
        './e2e/**/*.e2e-spec.ts'
    ],
    capabilities: {
        'browserName': 'chrome'
    },
    directConnect: true,
    baseUrl: 'http://localhost:4200/',
    framework: 'jasmine',
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000,
        print: function() {}
    },

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

    onPrepare() {
        require('ts-node').register({
            project: 'e2e/tsconfig.e2e.json'
        });
        jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
    }
};