'use strict';

const AWS = require('aws-sdk'),
    s3 = new AWS.S3(),
    waterMarkerObj = require('./waterMarking'),
    log = require('loglevel');

const lambdaJimpWrapper = function (options) {
    // TODO: provide default options or at least require waterMarkPath

    const waterMarker = new waterMarkerObj(options);

    return async (event, context) => {
        try {

            console.log('event', event);
            console.log('context', context);
            const srcBucket = event.Records[0].s3.bucket.name;
            // Object key may have spaces or unicode non-ASCII characters.
            const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

            // TODO: figure out dist bucket/key based on options (replace)
            const dstBucket = srcBucket,
                dstKey = srcKey,
                typeMatch = inferImageType(srcKey),
                imageType = typeMatch[1];

            let downloadedImage = await s3.getObject({
                Bucket: srcBucket,
                Key: srcKey
            });

            if (downloadedImage) {
                let { finalImage }  =waterMarker.addWatermark(downloadedImage);

                let success = s3.putObject({
                    Bucket: dstBucket,
                    Key: dstKey,
                    Body: finalImage,
                    ContentType: downloadedImage.ContentType
                });

                if(success) {
                    log.info('Successfully watermarked ' + srcBucket + '/' + srcKey +
                        ' and uploaded to ' + dstBucket + '/' + dstKey);
                } else {
                    log.error('Unable to watermark ' + srcBucket + '/' + srcKey +
                        ' and upload to ' + dstBucket + '/' + dstKey + ' due to an error: ' + err);
                }
            }

        } catch (err) {
            console.log(err);
        }
    };
};

function inferImageType(filename) {
    var match = filename.match(/\.([^.]*)$/);
    if (!match) {
        throw new Error('unable to infer image type for key: ' + filename);
    }
    return match;
}

module.exports = lambdaJimpWrapper;