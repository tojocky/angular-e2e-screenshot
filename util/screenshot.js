// Done based on protractor-screenshots, but with some improvements (mocha support, multiplathofrm support)
// How to use:
//
// describe('screenshot-test App', function () {
//   let page: ScreenshotTestPage;
//   const self = this;
//
//   beforeEach(() => {
//     page = new ScreenshotTestPage();
//   });
//
//   it('should display welcome message', () => {
//     page.navigateTo();
//     expect(page.getParagraphText()).toEqual('Welcome to app!');
//     screenshot.checkScreenshot(self, 'test');
//   });
// });
//
// in describe please use function instead of arrow function to be able to have access to the test suite object.

var $q = require('q'),
	slug = require('slug'),
	rimraf = require('rimraf'),
	resemble = require('node-resemble'),
	fs = require('fs'),
	path = require('path'),
	mkdirp = require('mkdirp'),
  debug = require('debug')('screenshot'),
  util = require('util'),
	disableScreenshots = browser.params['disableScreenshots'],
    screenshotBase = browser.params['screenshotsBasePath'] || 'screenshots',
    browserFolderName = browser.params['browserFolderName'] || '{browserName}',
  	screenshotSizes = browser.params['screenshotSizes'],
  	capabilityString = '',
  	capabilityStringWithoutVersion = '',
    capabilities = {};

debug('screenshotSizes: ', util.inspect(screenshotSizes, {colors: true, depth: 10}))

browser.getCapabilities().then(function(thisCapabilities) {
    var browserName, platform, version;
    capabilities = thisCapabilities
    debug(capabilities);
    // https://github.com/angular/protractor/issues/3036
    browserName = capabilities.get('browserName').toLowerCase();
    platform = capabilities.get('platform').toLowerCase();
    version = capabilities.get('version').toLowerCase();
    capabilities.browserName = browserName;
    capabilities.platform = platform;
    capabilities.version = version;
    capabilityStringWithoutVersion = browserFolderName;
    variableNames = Object.keys(capabilities);
    for (var i = 0; i < variableNames.length; ++i) {
      variableName = variableNames[i];
      capabilityStringWithoutVersion.replace( '{' + variableName + '}', capabilities[variableName])
    }
    return capabilityString = capabilityStringWithoutVersion + "-" + version;
    //return capabilitiesString = browserName;
});

exports.checkScreenshot = function(spec, screenshotName, delay, beforeEach, acceptedDiff) {
	debug('take screenshot %o', screenshotName, ', spec: ', util.inspect(spec, {colors: true, depth: 10}));
    if (disableScreenshots) {
      	return;
    }
    delay = delay || 0;
    if(typeof(beforeEach) !== 'function') {
    	acceptedDiff = beforeEach;
    	beforeEach = function() {};
    }
    return takeScreenshot(spec, screenshotName, delay, beforeEach, acceptedDiff);
};

function takeScreenshot(spec, screenshotName, delay, beforeEach, acceptedDiff) {
	var screenSizes = getMatchScreenshotSizes();
	if (screenSizes.length > 0) {
		debug('spread sizes');
		var dfd = protractor.promise.defer();
		for(var i = 0; i < screenSizes.length; ++i) {
			addSetScreenSizeAndTakeScreenshot(dfd.promise, screenSizes[i], spec, screenshotName, delay, beforeEach, acceptedDiff)
		}
		dfd.fulfill();
		return dfd.promise;
	} else {
		debug('no sizes');
		return actualTakeScreenshot(spec, screenshotName, beforeEach, acceptedDiff);
	}
};

function addSetScreenSizeAndTakeScreenshot(currPromise, size, spec, screenshotName, delay, beforeEach, acceptedDiff) {
	debug('addSetScreenSizeAndTakeScreenshot %o', screenshotName);
	return currPromise.then(function() {
		debug('setScreenSize %o', size);
		return setScreenSize(size.width, size.height)
			.then(function() {
				debug('browser.sleep %o', delay);
				return browser.sleep(delay);
			}).then(function() {
				debug('browser.takeScreenshot');
				return browser.takeScreenshot();
			})
			.then(function(data) {
				return matchScreenshot(spec, screenshotName, {
					width: size.width,
					height: size.height,
					data: data
				}, acceptedDiff);
			})
			.then(null, function(err){
				debug('screenshotName: %o, size: %o, err: %o', screenshotName, size, err);
			})
	});
}

function actualTakeScreenshot(spec, screenshotName, beforeEach, acceptedDiff) {
	debug('actualTakeScreenshot');
	return browser.driver.manage().window().getSize().then(function(screenSize) {
		beforeEach();
		return browser.takeScreenshot().then(function(data) {
			return matchScreenshot(spec, screenshotName, {
				width: screenSize.width,
				height: screenSize.height,
				data: data
			}, acceptedDiff);
		});
	});
};

function fileExistsPromise(filePath){
	var dfd = $q.defer();
	fs.exists(filePath, function(exists){
		return dfd.resolve(exists);
	})
	return dfd.promise;
}

function matchScreenshot(spec, screenshotName, screenshot, acceptedDiff) {
	debug('matchScreenshot ', spec);
	var label = "" + screenshotName + " - " + screenshot.width + "x" + screenshot.height,
		suite = spec.suite || spec,
		isJasmine = spec.suite != undefined,
		dirPathWithoutVersion = getPath(suite),
		dirPath = getPath(suite, true),
		filename = "" + (slug((spec.description || spec.title) + " " + screenshotName)) + "-" + screenshot.width + "x" + screenshot.height + ".png";
		return $q.fcall(function() {
			if (!suite._screenshotsInitialized) {
				debug('remove missing and fail folders')
			    return $q.all([$q.nfcall(rimraf, path.join(dirPath, 'missing')), $q.nfcall(rimraf, path.join(dirPath, 'failed')), $q.nfcall(rimraf, path.join(dirPath, 'diff'))]);
			} else {
			    return true;
			}
		}).then(function() {
			suite._screenshotsInitialized = true;
			return fileExistsPromise(path.join(dirPathWithoutVersion, filename))
				.then(function(exists){
					if(exists) {
						return path.join(dirPathWithoutVersion, filename);
					}
					debug('file from dir without version is missing, try to check with version');
					return path.join(dirPath, filename);
				})
		}).then(function(filePath){
			return $q.nfcall(fs.readFile, filePath);
		}).then(function(data) {
			debug('compare screenshots')
			if (screenshot.data === data.toString('base64')) {
			    return {
			        match: true
			    };
			}
			var dfd = $q.defer();
			resemble(new Buffer(screenshot.data, 'base64')).compareTo(data).onComplete(function(result) {
          //console.log(result);
			    if (result.misMatchPercentage === '0.00'
			    		|| (acceptedDiff && Number(result.misMatchPercentage) <= acceptedDiff)) {
				    return dfd.resolve({
				      	match: true,
				      	actual: screenshot.data
				    });
			    } else {
				    return dfd.resolve({
				        match: false,
				        label: label,
				        path: dirPath,
				        filename: filename,
				        actual: screenshot.data,
				        difference: result.getImageDataUrl().substr(22),
				        reason: "differed by " + result.misMatchPercentage + "%" + (acceptedDiff ? '(accepted ' + acceptedDiff + '%)' : '')
				    });
			    }
			});
			return dfd.promise;
		}, function(error) {
			debug('err: %o', error);
			if (error) {
			    return $q({
					label: label,
					path: dirPath,
					filename: filename,
					actual: screenshot.data,
					match: false,
					missing: true,
					reason: 'missing'
			    });
			}
		}).then(function(result) {
			if (result.match) {
				return result;
			}
		    return saveFailureImages(result)
		    		.then(function(){
		    			return result;
		    		});
		}).then(function(result){
			if(result.match || result.missing) {
				debug('added missing screenshot %o', result.label);
				// just add if missing without error
				return result.actual;
			}
			if(isJasmine) {
				expect(result.match).toBe(true, "" + result.label + " on " + capabilityString + ": " + result.reason);
			} else {
				expect(result.match).to.equal(true, "" + result.label + " on " + capabilityString + ": " + result.reason);
			}
			return result.actual;
		});
}

function saveFailureImages(result) {
	debug('saveFailureImages');
	if (result.missing) {
	    return $q.all([writeImage(result.actual, path.join(result.path, result.filename))]);
	} else {
	    return $q.all([writeImage(result.actual, path.join(result.path, "failed", result.filename)),
	    			writeImage(result.difference, path.join(result.path, "diff", result.filename))]);
	}
};

function writeImage(data, filePath) {
	debug('save file to '+filePath);
    return $q.nfcall(mkdirp, path.dirname(filePath)).then(function() {
	    return $q.nfcall(fs.writeFile, filePath, data, {
	        encoding: 'base64'
	    });
    });
};

function getPath(suite, useVersion) {
	debug('getPath ', suite, useVersion);
	function buildName(suite) {
		var prefix;
		prefix = '';
		if (suite.parentSuite) {
			prefix = "" + (buildName(suite.parentSuite));
		} else if (suite.parent) {
			prefix = "" + (buildName(suite.parent));
		}
		return path.join(prefix, (suite.description || suite.title));
	};
	var lastFolderName = slug( useVersion ? capabilityString : capabilityStringWithoutVersion);
	return path.join(screenshotBase, slug(buildName(suite)), lastFolderName);
};

function getMatchScreenshotSizes()
{
	if(!screenshotSizes) {
		debug('no screenshotSizes');
		return [];
	}
	var excludedKeys = ['sizes'];
	for(var i = 0; i < screenshotSizes.length; ++i) {
		var currProfile = screenshotSizes[i]
			currMatch = true,
			currKeys = Object.keys(currProfile);
		for(var j = 0; j < currKeys.length; ++j) {
			var currKey = currKeys[j];
			if(excludedKeys.indexOf(currKey) == -1 && capabilities[currKey] !== currProfile[currKey]) {
				currMatch = false;
				break;
			}
		}
		if(currMatch) {
			debug('found sizes: ', currProfile);
			return currProfile.sizes || [];
		}
	}
	debug('no match in screenshotSizes');
	return [];
}


function setScreenSize(width, height) {
	return browser.driver.manage().window().setSize(width, height);
};
