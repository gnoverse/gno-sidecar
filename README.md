# Gno Sidecar

This is a web browser extension for [Gnoweb](https://github.com/gnolang/gno/tree/master/gno.land/cmd/gnoweb) and more broadly [Gno](https://github.com/gnolang/gno/tree/master), providing a set of devtools, tweaks and experimentation.
This extension is neither intended to be secure in any way nor to provide a good user experience.

#### Compatibility

| Browser |     Working     |
| :-----: | :-------------: |
|  Brave  |       ✅        |
| Chrome  |       ✅        |
|  Edge   |       ✅        |
| Firefox | ❌ (PR Welcome) |

## Install

**TODO**: Set up a build workflow using GitHub Actions then add a link to the releases page

## Contribute

### Build

The easiest way is to use the Makefile to run or build the extension.

#### Help

To get basic help you can use the help rule.

```bash
make help
# OR
make
```

#### Development Mode

This rule runs the extension in development mode. It will launch a new browser instance with your extension loaded. The page will automatically reload whenever you make changes to your code, allowing for a smooth development experience.

```bash
make start_dev
```

#### Production Preview

This rule runs your extension in production mode. It will launch a new browser instance with your extension loaded, simulating the environment and behavior of your extension as it will appear once published.

```bash
make start_prod
```

#### Build for Production

This rule builds your extension for production. It optimizes and bundles your extension, preparing it for deployment to the target browser's store.

```bash
make build
```

#### Target Browsers

For each of the above Makefile rules, you can use the environment variable `BROWSER` to specify a target browser. You can either specify one of the following 3 values `chrome`, `edge` or `firefox` (default), or specify multiple values separated by a comma, e.g :

```bash
BROWSER=firefox,edge make build
```

## License

This project is licensed under the Apache 2.0 License. See the ./LICENSE.md file for more information.

## Credits

- SVG icons from [Uicons by Flaticon](https://www.flaticon.com/uicons)
- Project based on the awesome [extension.js](https://github.com/extension-js/extension.js)
