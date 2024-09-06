import fs from 'node:fs';
import qr from 'qrcode';
import { createCanvas, Image } from 'canvas';
import admZip from 'adm-zip';

const zip = new admZip();

const args = process.argv;
const input = process.argv.indexOf('--input') > -1 ? args[process.argv.indexOf('--input') + 1] : undefined;
const output = process.argv.indexOf('--output') > -1 ? args[process.argv.indexOf('--output') + 1] : undefined;
let zipOutput = process.argv.indexOf('--zip-output') > -1 ? args[process.argv.indexOf('--zip-output') + 1] : undefined;
const logoSrc = process.argv.indexOf('--logo') > -1 ? args[process.argv.indexOf('--logo') + 1] : undefined;
const layerSrc = process.argv.indexOf('--layer') > -1 ? args[process.argv.indexOf('--layer') + 1] : undefined;
let url = process.argv.indexOf('--url') > -1 ? args[process.argv.indexOf('--url') + 1] : undefined;
let errorCorrectionLevel = process.argv.indexOf('--error-lvl') > -1 ? args[process.argv.indexOf('--error-lvl') + 1] : undefined;
let resolution = process.argv.indexOf('--resolution') > -1 ? args[process.argv.indexOf('--resolution') + 1] : undefined;
let imgQuality = process.argv.indexOf('--quality') > -1 ? args[process.argv.indexOf('--quality') + 1] : undefined;
const type = process.argv.indexOf('--type') > -1 ? args[process.argv.indexOf('--type') + 1] : undefined;
let dark = process.argv.indexOf('--dark') > -1 ? args[process.argv.indexOf('--dark') + 1] : undefined;
let light = process.argv.indexOf('--light') > -1 ? args[process.argv.indexOf('--light') + 1] : undefined;

if (args.indexOf('--help') > -1 || args.length < 3) {
    console.log(
        'QR code generator usage:\n' +
        '\n' +
        '--input Input csv file.\n' +
        '--output Output directory.\n' +
        '--zip-output Output location for the zip. (Default to same directory as output)\n' +
        '--logo Logo to overlay on top.\n' +
        '--layer Layer to overlay on top.\n' +
        '--url Base URL to use for the QR code.\n' +
        '--error-lvl Level of error correction [L, M, Q, H] (Default: Q).\n' +
        '--resolution Resolution of the image (Default: 512x512).\n' +
        '--quality Image quality [0.1 - 1] (Default: 0.8).\n' +
        '--type Image type to use [jpg, png] (Default: jpg).\n' +
        '--dark Specify the colour to use in hex instead of black.\n' +
        '--light Specify the colour to use in hex instead of white.\n'
    );
    process.exit(0);
}

if (!errorCorrectionLevel) {
    errorCorrectionLevel = 'Q';
}

if (!imgQuality || !Number.isSafeInteger(parseFloat(imgQuality))) {
    imgQuality = 0.8;
}

if (!resolution || !Number.isSafeInteger(parseInt(resolution))) {
    resolution = 512;
}

if (!zipOutput) {
    zipOutput = `${output}/archive.zip`;
}

if (!dark) {
    dark = '000000';
}

if (!light) {
    light = 'FFFFFF';
}

if (!['l', 'm', 'q', 'h'].includes(errorCorrectionLevel.toLocaleLowerCase())) {
    console.log('The level of error correction you specified is invalid!');
    process.exit(1);
}

let fileExtension = 'jpg';
let mimeType = 'image/jpeg'

if (type === 'png') {
    fileExtension = 'png';
    mimeType = 'image/png'
}

if (imgQuality < 0.1 || imgQuality > 1) {
    console.log('The image quality you selected has to be between 0.1 and 1!');
    process.exit(1);
}

if (!input) {
    console.log('You are missing the required input csv!');
    process.exit(1);
}

if (!fs.existsSync(input)) {
    console.log('It does not look like you gave me a valid file!');
    process.exit(1);
}

if (!output) {
    console.log('You are missing the required output directory!');
    process.exit(1);
}

if (!fs.existsSync(output)) {
    console.log('It does not look like you gave me a valid directory!');
    process.exit(1);
}

if (!fs.existsSync(logoSrc)) {
    console.log('It does not look like you gave me a valid logo to use!');
    process.exit(1);
}

if (layerSrc) {
    if (!fs.existsSync(layerSrc)) {
        console.log('It does not look like a valid file!');
    }
}

if (!url) {
    console.log('You are missing the required URL!');
    process.exit(1);
}

if (!url.endsWith('/')) {
    url += '/';
}

const zipBuffer = [];

(async () => {  
    // Read list of usernames
    const usernames = fs.readFileSync(input, 'utf-8').split('\n');
    // Create the image
    await generateImage(usernames);
    // zip it up
    makeZip(zipBuffer);

    console.log('Done!');
})();


async function generateImage(usernames) {
    const canvas = createCanvas(parseInt(resolution), parseInt(resolution));
    const ctx = canvas.getContext('2d');

    for (const name of usernames) {
        if (name === '') continue;

        // Create the QR code at configured resolution and error correction
        const initQr = await qr.toBuffer(`${url}${name}`, { 
            width: resolution,
            errorCorrectionLevel: errorCorrectionLevel,
            color: {
                dark: dark,
                light: light
            }
        });
    
        // Load the QR code and put it on the canvas
        let img = new Image()
        img.onload = () => ctx.drawImage(img, 0, 0)
        img.onerror = err => { throw err }
        img.src = initQr
    
        // Load the specified logo and place it in the middle of the image and resize it accordingly
        const logo = fs.readFileSync(logoSrc);
        img = new Image()
        img.onload = () => {
            const desiredSize = resolution / 4;
            ctx.drawImage(img, 0,0 , img.width, img.height, resolution / 2 - desiredSize / 2, resolution / 2 - desiredSize / 2, desiredSize, desiredSize);
        }
        img.onerror = err => { throw err }
        img.src = logo

        // If the layer image exist, place it over the image
        if (fs.existsSync(layerSrc)) {
            const layer = fs.readFileSync(layerSrc);
            img = new Image()
            img.onload = () => {
                ctx.drawImage(img, 0,0 , img.width, img.height, 0,0, resolution, resolution);
            }
            img.onerror = err => { throw err }
            img.src = layer
        }

        // Output canvas to buffer and write said buffer to file
        const buffer = canvas.toBuffer(mimeType, { quality: imgQuality });
        zipBuffer.push({ filename: `${name}.${fileExtension}`, buffer: buffer });
        fs.writeFile(`./${output}/${name}.${fileExtension}`, buffer, () => {
            console.log(`wrote ${name}.${fileExtension}`);
        });    
    }
}

function makeZip(zipBuffer) {
    for (const buffer of zipBuffer) {
        console.log(`Adding to zip ${buffer.filename}`)
        zip.addFile(buffer.filename, buffer.buffer);
    }

    zip.writeZip(`./${zipOutput}`);
}