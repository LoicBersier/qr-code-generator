Requirements:
* [Node.JS](https://nodejs.org/)
* [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
* [node-canvas](https://github.com/Automattic/node-canvas?tab=readme-ov-file#installation)

You can install the dependencies by executing `npm i` in the terminal.

Supported error correction:

| Level            | Error resistance |
|------------------|:----------------:|
| **L** (Low)      | **~7%**          |
| **M** (Medium)   | **~15%**         |
| **Q** (Quartile) | **~25%**         |
| **H** (High)     | **~30%**         |

Low and medium will likely not work, depends the logo used.

```
node index.js --help

QR code generator usage:

--input Input csv file.
--output Output directory.
--zip-output Output location for the zip. (Default to same directory as output)
--logo Logo to overlay on top.
--layer Layer to overlay on top.
--url Base URL to use for the QR code.
--error-lvl Level of error correction [L, M, Q, H] (Default: Q).
--resolution Resolution of the image (Default: 512x512)
--quality Image quality [0.1 - 1] (Default: 0.8)
--type Image type to use [jpg, png] (Default: jpg)
```