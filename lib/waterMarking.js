'use strict';

const jimp = require('jimp'),
    defaultOptions = {
        ratio: 0.6,
        opacity: 0.6,
        text: 'jimp-watermark',
        textSize: 1
    }, SizeEnum = Object.freeze({
        1: jimp.FONT_SANS_8_BLACK,
        2: jimp.FONT_SANS_10_BLACK,
        3: jimp.FONT_SANS_12_BLACK,
        4: jimp.FONT_SANS_14_BLACK,
        5: jimp.FONT_SANS_16_BLACK,
        6: jimp.FONT_SANS_32_BLACK,
        7: jimp.FONT_SANS_64_BLACK,
        8: jimp.FONT_SANS_128_BLACK,
    }), ErrorTextSize = new Error("Text size must range from 1 - 8"),
    ErrorScaleRatio = new Error("Scale Ratio must be less than one!"),
    ErrorOpacity = new Error("Opacity must be less than one!");

class waterMarking {

    constructor(options) {
        this.options = this.checkOptions(options);
        console.log(this.options);
    }

    checkOptions = (options) => {
        options = {...defaultOptions, ...options};
        if (options.ratio > 1) {
            throw ErrorScaleRatio;
        }
        if (options.opacity > 1) {
            throw ErrorOpacity;
        }
        return options;
    }

    getDimensions = (H, W, h, w, ratio) => {
        let hh, ww;
        if ((H / W) < (h / w)) {    //GREATER HEIGHT
            hh = ratio * H;
            ww = hh / h * w;
        } else {                //GREATER WIDTH
            ww = ratio * W;
            hh = ww / w * h;
        }
        return [hh, ww];
    }

    /**
     * @param {Object} options
     * @param {String} options.text     - String to be watermarked
     * @param {Number} options.textSize - Text size ranging from 1 to 8
     * @param {Number} options.waterMarkImage - Text size ranging from 1 to 8
     */

    addTextWatermark = async (imageUrl) => {
        try {
            const mainImage = await jimp.read(imageUrl),
                maxHeight = mainImage.getHeight(),
                maxWidth = mainImage.getWidth();

            if (Object.keys(SizeEnum).includes(String(this.options.textSize))) {
                const font = await jimp.loadFont(SizeEnum[this.options.textSize]);

                const X = 0,        //Always center aligned
                    Y = 0;

                const finalImage = await mainImage.print(font, X, Y, {
                    text: this.options.text,
                    alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
                    alignmentY: jimp.VERTICAL_ALIGN_MIDDLE
                }, maxWidth, maxHeight);

                finalImage.quality(100).write(this.options.dstPath);
                return {
                    finalImage
                };
            } else {
                throw ErrorTextSize;
            }
        } catch (err) {
            throw err;
        }
    }

    /**
     * @param {String} watermarkImage - Path of the watermark image to be applied
     * @param {Object} options
     * @param {Float} options.ratio     - Ratio in which the watermark is overlaid
     * @param {Float} options.opacity   - Value of opacity of the watermark image during overlay
     */


    addWatermark = async (imageUrl) => {
        try {
            const mainImage = await jimp.read(imageUrl);
            const watermark = await jimp.read(this.options.waterMarkImage);
            const [newHeight, newWidth] = this.getDimensions(mainImage.getHeight(), mainImage.getWidth(), mainImage.getHeight(), mainImage.getWidth(), this.options.ratio);
            watermark.resize(newWidth, newHeight);
            const positionX = (mainImage.getWidth() - newWidth) / 2;     //Centre aligned
            const positionY = (mainImage.getHeight() - newHeight) / 2;   //Centre aligned
            watermark.opacity(this.options.opacity);
            mainImage.composite(watermark,
                positionX,
                positionY,
                jimp.HORIZONTAL_ALIGN_CENTER | jimp.VERTICAL_ALIGN_MIDDLE);
            mainImage.quality(100);
            return {
                finalImage: mainImage
            };
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}


module.exports = waterMarking;