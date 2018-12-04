/**
 * Script designed to generate the TextCanvas' FontCatalog assets.
 * Usage: npm run create-font-catalog -- -n <name> -f <file> -s <size> -t <type> -d <distance>
 */

// tslint:disable
const minimist = require("minimist");
const fs = require("fs");
const path = require("path");
const mkpath = require("mkpath");
const fontkit = require("fontkit");
const unicodeBlocks = require("unicode-range-json");
const generateBMFont = require("msdf-bmfont-xml");
// tslint:enable

interface UnicodeBlock {
    name: string;
    min: number;
    max: number;
    fonts: string[];
}

interface Font {
    name: string;
    metrics: {
        size: number;
        distanceRange: number;
        base: number;
        lineHeight: number;
        lineGap: number;
        capHeight: number;
        xHeight: number;
    };
    charset: string;
    bold?: string;
    italic?: string;
    boldItalic?: string;
}

interface FontCatalog {
    name: string;
    type: string;
    size: number;
    maxWidth: number;
    maxHeight: number;
    distanceRange: number;
    fonts: Font[];
    supportedBlocks: UnicodeBlock[];
}

// Output JSON.
const fontCatalog: FontCatalog = {
    name: "",
    type: "",
    size: 0.0,
    maxWidth: 0.0,
    maxHeight: 0.0,
    distanceRange: 0.0,
    fonts: [],
    supportedBlocks: []
};

// SDF Texture Generation options.
const sdfOptions = {
    outputType: "json",
    filename: "",
    charset: "",
    fontSize: 0.0,
    texturePadding: 2.0,
    fieldType: "",
    distanceRange: 0.0,
    smartSize: true
};

async function createReplacementAssets(): Promise<void> {
    const fontPath = `./resources-dev/Fonts/NotoSans-Regular.ttf`;
    const fontInfo = fontkit.openSync(fontPath);
    const fontObject = {
        name: "Extra",
        metrics: {
            size: sdfOptions.fontSize,
            distanceRange: sdfOptions.distanceRange,
            base: 0.0,
            lineHeight: 0.0,
            lineGap: Math.round((fontInfo.lineGap / fontInfo.unitsPerEm) * sdfOptions.fontSize),
            capHeight: Math.round((fontInfo.capHeight / fontInfo.unitsPerEm) * sdfOptions.fontSize),
            xHeight: Math.round((fontInfo.xHeight / fontInfo.unitsPerEm) * sdfOptions.fontSize)
        },
        charset: ""
    };

    await new Promise((resolve, reject) => {
        const assetsDir = path.resolve(
            fontPath,
            `../../../resources/fonts/${fontCatalog.name}_Assets/`
        );
        sdfOptions.filename = "Specials";

        const supportedCharset = "�";
        fontObject.charset += supportedCharset;
        sdfOptions.charset = supportedCharset;

        generateBMFont(fontPath, sdfOptions, (error: any, textures: any, rawJson: any) => {
            if (error) {
                reject(error);
                return;
            }

            // Make sure the destination path exists.
            mkpath.sync(assetsDir + "/Extra");

            // Save all the texture pages.
            textures.forEach((texture: any, index: number) => {
                fs.writeFileSync(`${assetsDir}/Extra/${texture.filename}.png`, texture.texture);
            });

            // Store the font size, lineHeight and baseline.
            const json = JSON.parse(rawJson.data);
            fontObject.metrics.lineHeight = json.common.lineHeight;
            fontObject.metrics.base = json.common.base;

            // Store the max entry size width/height.
            for (const char of json.chars) {
                fontCatalog.maxWidth = Math.max(fontCatalog.maxWidth, char.width);
                fontCatalog.maxHeight = Math.max(fontCatalog.maxHeight, char.height);
            }

            // Save the generated json.
            fs.writeFileSync(`${assetsDir}/Extra/Specials.json`, rawJson.data);
            resolve();
        });
    });

    // If suceeded, register this block in the fontCatalog.
    const blockEntry = fontCatalog.supportedBlocks.find((element: any) => {
        return element.name === "Specials";
    });
    if (blockEntry === undefined) {
        fontCatalog.supportedBlocks.push({
            name: "Specials",
            min: 65520,
            max: 65535,
            fonts: ["Extra"]
        });
    } else {
        blockEntry.fonts.push("Extra");
    }

    fontCatalog.fonts.push(fontObject);
}

async function createBlockAssets(
    font: any,
    fontObject: Font,
    fontPath: string,
    unicodeBlock: any,
    info: any,
    bold: boolean,
    italic: boolean
): Promise<void> {
    await new Promise((resolve, reject) => {
        const assetSuffix =
            bold === true
                ? italic === true
                    ? "_BoldItalicAssets/"
                    : "_BoldAssets/"
                : italic === true
                    ? "_ItalicAssets/"
                    : "_Assets/";
        const assetsDir = path.resolve(
            fontPath,
            `../../../resources/fonts/${fontCatalog.name}${assetSuffix}`
        );
        sdfOptions.filename = unicodeBlock.category.replace(/ /g, "_");

        // Make sure that, for each unicode block, we store only the characters supported by the
        // font.
        let supportedCharset = "";
        for (const codePoint of info.characterSet) {
            if (codePoint >= unicodeBlock.range[0] && codePoint <= unicodeBlock.range[1]) {
                supportedCharset += String.fromCodePoint(codePoint);
            }
        }
        fontObject.charset += supportedCharset;
        sdfOptions.charset = supportedCharset;

        if (sdfOptions.charset === "") {
            reject(
                `No characters in "${unicodeBlock.category}" are supported by font "${font.name}".`
            );
        } else {
            const assetType =
                bold === true
                    ? italic === true
                        ? "BOLD ITALIC"
                        : "BOLD"
                    : italic === true
                        ? "ITALIC"
                        : "";
            // tslint:disable-next-line:no-console
            console.log(`Generating ${assetType} assets for block: ${unicodeBlock.category}`);

            generateBMFont(fontPath, sdfOptions, (error: any, textures: any, rawJson: any) => {
                if (error) {
                    reject(error);
                    return;
                }

                // Make sure the destination path exists.
                mkpath.sync(assetsDir + "/" + font.name);

                // Save all the texture pages.
                textures.forEach((texture: any, index: number) => {
                    fs.writeFileSync(
                        `${assetsDir}/${font.name}/${texture.filename}.png`,
                        texture.texture
                    );
                });

                // Store the font size, lineHeight and baseline.
                const json = JSON.parse(rawJson.data);
                fontObject.metrics.lineHeight = json.common.lineHeight;
                fontObject.metrics.base = json.common.base;

                // Store the max entry size width/height.
                for (const char of json.chars) {
                    fontCatalog.maxWidth = Math.max(fontCatalog.maxWidth, char.width);
                    fontCatalog.maxHeight = Math.max(fontCatalog.maxHeight, char.height);
                }

                // Save the generated json.
                fs.writeFileSync(
                    `${assetsDir}/${font.name}/${unicodeBlock.category.replace(/ /g, "_")}.json`,
                    rawJson.data
                );
                resolve();
            });
        }
    });
}

async function createFontAssets(
    font: any,
    fontObject: Font,
    fontPath: string,
    info: any,
    bold: boolean,
    italic: boolean
): Promise<void> {
    const fontVariant =
        bold === true
            ? italic === true
                ? font.boldItalic
                : font.bold
            : italic === true
                ? font.italic
                : font.name;
    // tslint:disable-next-line:no-console
    console.log("Generating assets for font: " + fontVariant);

    // Generate an individual BMFont asset for each unicode block supported by this font.
    for (const blockName of font.blocks) {
        let selectedBlock;
        for (const unicodeBlock of unicodeBlocks) {
            if (unicodeBlock.category === blockName) {
                selectedBlock = unicodeBlock;
                break;
            }
        }

        // Check if we have a valid block.
        if (selectedBlock === undefined) {
            // tslint:disable-next-line:no-console
            console.log(`WARN: "${blockName}" is not a valid Unicode Block.`);
            continue;
        }

        // Try generating assets for this block.
        try {
            await createBlockAssets(font, fontObject, fontPath, selectedBlock, info, bold, italic);
        } catch (e) {
            // tslint:disable-next-line:no-console
            console.log("WARN: " + e);
            continue;
        }

        // If succeeded, register this block in the fontCatalog.
        const blockEntry = fontCatalog.supportedBlocks.find((element: any) => {
            return element.name === blockName;
        });
        if (blockEntry === undefined) {
            fontCatalog.supportedBlocks.push({
                name: blockName,
                min: selectedBlock.range[0],
                max: selectedBlock.range[1],
                fonts: [font.name]
            });
        } else if (bold === false && italic === false) {
            blockEntry.fonts.push(font.name);
        }
    }
}

async function main() {
    const args = minimist(process.argv.slice(2));
    fontCatalog.name = args.n !== undefined ? args.n : "Default";
    // tslint:disable-next-line:no-console
    console.log("Creating: " + fontCatalog.name);

    if (args.f === undefined) {
        // tslint:disable-next-line:no-console
        console.error("ERROR: No supported fonts file was specified (-f).");
        return;
    }

    sdfOptions.fontSize = args.s !== undefined ? Number(args.s) : 32.0;
    sdfOptions.fieldType = args.t === "msdf" ? "msdf" : "sdf";
    sdfOptions.distanceRange = args.d !== undefined ? Number(args.d) : 8.0;
    fontCatalog.size = sdfOptions.fontSize;
    fontCatalog.type = sdfOptions.fieldType;
    fontCatalog.distanceRange = sdfOptions.distanceRange;

    // Get the JSON file containing a description of all fonts included in this font catalog, and
    // the unicode blocks each one should support.
    const jsonDir = path.resolve(__dirname, args.f);
    const fontsJson = JSON.parse(
        fs.readFileSync(jsonDir, {
            encoding: "utf8"
        })
    );
    const fontDir = path.resolve(jsonDir, fontsJson.dir);

    // Generate the BMFont assets for all fonts.
    for (const font of fontsJson.fonts) {
        const fontPath = `${fontDir}/${font.name}.ttf`;
        const fontInfo = fontkit.openSync(fontPath);
        const fontObject: Font = {
            name: font.name,
            metrics: {
                size: sdfOptions.fontSize,
                distanceRange: sdfOptions.distanceRange,
                base: 0.0,
                lineHeight: 0.0,
                lineGap: Math.round((fontInfo.lineGap / fontInfo.unitsPerEm) * sdfOptions.fontSize),
                capHeight: Math.round(
                    (fontInfo.capHeight / fontInfo.unitsPerEm) * sdfOptions.fontSize
                ),
                xHeight: Math.round((fontInfo.xHeight / fontInfo.unitsPerEm) * sdfOptions.fontSize)
            },
            charset: ""
        };
        await createFontAssets(font, fontObject, fontPath, fontInfo, false, false);

        // Check if we need to also create assets for the different font style variants.
        if (font.bold !== undefined) {
            const boldFontPath = `${fontDir}/${font.bold}.ttf`;
            const boldFontInfo = fontkit.openSync(boldFontPath);
            fontObject.bold = font.bold;
            await createFontAssets(font, fontObject, boldFontPath, boldFontInfo, true, false);
        }
        if (font.italic !== undefined) {
            const italicFontPath = `${fontDir}/${font.italic}.ttf`;
            const italicFontInfo = fontkit.openSync(italicFontPath);
            fontObject.italic = font.italic;
            await createFontAssets(font, fontObject, italicFontPath, italicFontInfo, false, true);
        }
        if (font.boldItalic !== undefined) {
            const boldItalicFontPath = `${fontDir}/${font.boldItalic}.ttf`;
            const boldItalicFontInfo = fontkit.openSync(boldItalicFontPath);
            fontObject.boldItalic = font.boldItalic;
            await createFontAssets(
                font,
                fontObject,
                boldItalicFontPath,
                boldItalicFontInfo,
                true,
                true
            );
        }
        fontCatalog.fonts.push(fontObject);
    }

    // Generate BMFont assets for the replacement character.
    await createReplacementAssets();

    // Wrote the font catalog to a file.
    const fontCatalogData = JSON.stringify(fontCatalog);
    fs.writeFileSync(
        path.resolve(__dirname, `../resources/fonts/${fontCatalog.name}_FontCatalog.json`),
        fontCatalogData
    );
}

main();
