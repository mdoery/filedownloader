"use strict";

var http = require("http");
var fs = require("fs");
var os = require("os");
var url = require("url");
var path = require("path");

/**
 * Set DEBUG to true if you want to skip downloading file, and test code.
 */
var DEBUG = false;

/**
 * Searches videoObjects Object to look for a video which does not have
 * "downloaded" property set to false.
 * @param {Object} the entire list of videos as a JSON Array of video objects.
 * @return {Object} the video Object to download. This is not a clone; it is
 * an Object which is still held in videoObjects, so manipulating it does
 * change videoObjects.
 */
var getNextDownload = function(videoObjects) {
	var videoToDownload;
	videoObjects.some(function(obj) {
		if (obj.downloaded) {
			return false;
		}
		videoToDownload = obj;
		return true;
	});
	logMsg("Current video to download " + JSON.stringify(videoToDownload));
	return videoToDownload;
};

/**
 * Downloads a video file.
 * @param {String} fully qualified url to download e.g.
 *   "http://example.com/video.mp4"
 * @param {String} fully qualified path to download file to, e.g.
 *   "/home/superuser/something.mp4"
 * @param {Function} to call upon finish of download
 */
var downloadFile = function(url, dest, cb) {
	if (DEBUG) {
		cb();
		return;
	}
	var file = fs.createWriteStream(dest);
	var request = http.get(url, function(response) {
		response.pipe(file);
		file.on('finish', function() {
			file.close(cb);
		});
	});
	// Error handling:
	request.on('error', function (err) {
        fs.unlink(dest);
        return cb(err);
    });
	file.on('error', function(err) {
		fs.unlink(dest); // Delete file async, do not check result
		return cb(err.message);
	});
};

/**
 * Open a file which contains a JSON object. Parse the JSON object and decide
 * which file to download next. list.txt is the canonical file which has
 * information about which files have been downloaded. File list.txt is
 * overwritten each time it is used.
 */
var downloadNextVideo = function() {
	var contents = fs.readFileSync(__dirname + '/list.txt', 'utf8');
	var videoObjects = JSON.parse(contents);
	var videoToDownload = getNextDownload(videoObjects);
	logMsg("Going to download: " + JSON.stringify(videoToDownload));
	var parsed = url.parse(videoToDownload.url);
	var fileName = path.basename(parsed.pathname);
	// sanity check: should end with mp4 and start with V
	if (fileName.indexOf("V") === 0 && fileName.indexOf(".mp4") === fileName.length - 4) {
		logMsg("File being written: " + fileName);
		downloadFile(videoToDownload.url, fileName, function() {
			logMsg("Done!");
			videoToDownload.downloaded = true;
			copyFile(videoToDownload, function(err) {
				if (err) {
					logMsg(err);
				} else {
					printVideoObjectsToFile(videoObjects);
				}
			});
		});
	} else {
		logMsg("Problem with filename, quitting");
	}
};

/**
 * Makes a copy of the current list.txt file into list.txt.timestamp
 * @param {Object} videoObject represents the video which was downloaded now
 * @param {Function} callback to call when done copying and writing files
 */
var copyFile = function(videoObject, cb) {
	var inputFile = __dirname + "/list.txt";
	var timestamp = new Date(videoObject.date).getTime();
	var outputFile = __dirname + "/list.txt." + timestamp;
	var f = fs.createWriteStream(outputFile);
	f.on('error', function(err) {
		fs.unlink(outputFile); // Delete file async, do not check result
		cb(err.message);
	});
	f.on('finish', function(err) {
		cb(null);
	});
	fs.createReadStream(inputFile).pipe(f);
};

/**
 * Overwrites the existing lists.txt file with an updated version of the JSON.
 * This new JSON has "downloaded" set to true for the videoObject that was
 * downloaded just now.
 * @param {Object} the entire list of videos as a JSON Array of video objects.
 */
var printVideoObjectsToFile = function(obj) {
	var fileName = __dirname + '/list.txt';
	var encoding = ['utf8'];
	fs.writeFileSync(fileName, JSON.stringify(obj, null, 2), encoding);
	return;
};

var logMsg = function(str) {
	process.stdout.write(str + os.EOL);
};

/**
 * Your list.txt file is a JSON-formatted file containing an Array of videos.
 * It looks like this:
 [
  {
    "url": "http://example.com/video1.mp4",
    "title": "A title of interest",
    "date": "July 24, 2018",
    "downloaded": true
  },
  {
    "url": "http://example.com/video2.mp4",
    "title": "another title",
    "date": "July 17, 2018",
  },
  ...
 ]
 */
downloadNextVideo();