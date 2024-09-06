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
Usage: index [OPTIONS]...

Options:
  -v, --version              output the version number
  -i, --input <value>        CSV input file.
  -o, --output <value>       Output directory.
  -zo, --zip-output <value>  Output location for the zip. (default: "./archive.zip")
  -l, --logo <value>         Logo to overlay on top.
  -L, --layer <value>        Layer to overlay on top.
  -u, --url <value>          Base URL t use for the QR codes.
  -e, --error-lvl <value>    Level of error correction [L, M, Q, H]. (default: "Q")
  -r, --resolution <value>   Image resolution. (default: 512)
  -q, --quality <value>      Image quality. (default: 0.8)
  -t, --type <value>         Image file type [jpg, png] (default: "jpg")
  -b, --dark <value>         Colour to use in hex instead of black. (default: "000000")
  -w, --light <value>        Colour to use in hex instead of white. (default: "FFFFFF")
  -h, --help                 display help for command
```