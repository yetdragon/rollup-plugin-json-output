# rollup-plugin-json-output

[![npm version](https://img.shields.io/npm/v/rollup-plugin-json-output)](https://www.npmjs.com/package/rollup-plugin-json-output)

A Rollup plugin that converts modules to JSON by serializing their default exports using `JSON.stringify`.

- ⚡️ Generate dynamic JSON from JavaScript configuration files
- 🔄 Seamless integration with Rollup build process

## Requirements

- Node.js >= 25.0.0 or Deno >= 2.5.0
- Rollup >= 2.0.0

## Usage

### Install

```shell
npm install --save-dev rollup-plugin-json-output
```

### Example

```javascript
// rollup.config.js
import { jsonOutput } from "rollup-plugin-json-output";

export default [
	{
		// Main build configuration
		input: "src/index.js",
		output: {
			dir: "dist"
		}
	}, {
		input: "manifest.config.js",
		output: {
			file: "dist/manifest.json",
		},
		plugins: [jsonOutput()]
	}
];

// manifest.config.js
import packageJson from "./package.json" with { type: "json" };

export default {
	manifest_version: 3,
	name: "my-extension",
	version: packageJson.version
};
```

### Options

- `indent`: Specify the indentation of the JSON output. Set to `null` for no indentation.
  - Type: `string | number | null`
  - Default: `    ` (4 spaces)

- `replacer`: Transform or filter values during serialization.
  - Type: `(key: string, value: unknown) => unknown | (number | string)[]`
  - Default: `undefined`

## License

Copyright © 2025 yetDragon

This project is licensed under the [Copyfree Open Innovation License (COIL-1.0)](https://coil.apotheon.org/). See [LICENSE.md](LICENSE.md) for details.
