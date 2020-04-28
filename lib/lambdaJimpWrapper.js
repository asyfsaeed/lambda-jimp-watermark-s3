'use strict';

const AWS = require('aws-sdk'),
    s3 = new AWS.S3(),
    waterMarkerObj = require('./waterMarking'),
    log = require('loglevel');

const lambdaJimpWrapper = function (options) {
    // TODO: provide default options or at least require waterMarkPath

    console.log(options);
    const waterMarker = new waterMarkerObj(options);

    return async (event, context) => {
        try {

            const srcBucket = event.Records[0].s3.bucket.name;
            // Object key may have spaces or unicode non-ASCII characters.
            const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

            // TODO: figure out dist bucket/key based on options (replace)
            const dstBucket = srcBucket,
                dstKey = srcKey,
                typeMatch = inferImageType(srcKey),
                imageType = typeMatch[1];

            s3.getObject({
                Bucket: srcBucket,
                Key: srcKey
            }, async (err, data) => {

                if (err) {
                    log.error('Unable to watermark ' + srcBucket + '/' + srcKey +
                        ' and upload to ' + dstBucket + '/' + dstKey + ' due to an error: ' + err);
                    throw err;
                }

                let {finalImage} = await waterMarker.addWatermark(data.Body);

                console.log('finalImage', finalImage);
                s3.putObject({
                    Bucket: dstBucket,
                    Key: dstKey,
                    Body: finalImage,
                    ContentType: data.ContentType
                });

                log.info('Successfully watermarked ' + srcBucket + '/' + srcKey +
                    ' and uploaded to ' + dstBucket + '/' + dstKey);

            });

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