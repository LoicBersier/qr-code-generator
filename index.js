import fs from 'node:fs';
import qr from 'qrcode';
import { createCanvas, Image } from 'canvas';
import admZip from 'adm-zip';
import { program } from 'commander';
const zip = new admZip();

program
    .version('1.0.0', '-v, --version')
    .usage('[OPTIONS]...')
    .option('-i, --input <value>', 'CSV input file.')
    .option('-o, --output <value>', 'Output directory.')
    .option('-zo, --zip-output <value>', 'Output location for the zip.', './archive.zip')
    .option('-l, --logo <value>', 'Logo to overlay on top.')
    .option('-L, --layer <value>', 'Layer to overlay on top.')
    .option('-u, --url <value>', 'Base URL t use for the QR codes.')
    .option('-e, --error-lvl <value>', 'Level of error correction [L, M, Q, H].', 'Q')
    .option('-r, --resolution <value>', 'Image resolution.', 512)
    .option('-q, --quality <value>', 'Image quality.', 0.8)
    .option('-t, --type <value>', 'Image file type [jpg, png]', 'jpg')
    .option('-b, --dark <value>', 'Colour to use in hex instead of black.', '000000')
    .option('-w, --light <value>', 'Colour to use in hex instead of white.', 'FFFFFF')
    .parse(process.argv);

if (process.argv.length < 3) {
    program.help();
}

const options = program.opts();

const input = options.input;
const output = options.output;
let zipOutput = options.zipOutput;
const logoSrc = options.logo;
const layerSrc = options.layer;
let url = options.url;
let errorCorrectionLevel = options.errorLvl;
let resolution = options.resolution;
let imgQuality = options.quality;
const type = options.type;
let dark = options.dark;
let light = options.light;

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