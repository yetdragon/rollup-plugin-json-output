/// <reference lib="esnext" />

import type { Plugin } from "rollup"

import packageJson from "../package.json" with { type: "json" }

const PLUGIN_NAME = packageJson.name.slice(14)
const PLUGIN_VERSION = packageJson.version

interface JsonOutputOptions {
	/**
	 * Specify the indentation of the JSON output. \
	 * Set to `null` for compact output.
	 * @default "    " // 4 spaces
	 */
	indent?: string | number | null

	/**
	 * Transform or filter values during serialization.
	 * @see [MDN Web Docs](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#the_replacer_parameter)
	 */
	replacer?: (key: string, value: unknown) => unknown | (number | string)[]

	/**
	 * Control whether to respect the bundler's minification settings. \
	 * When enabled, {@link indent} is ignored if the bundler set `output.compact` (Rollup) or `output.minify` (Rolldown) to `true`.
	 * @default true
	 */
	respectCompact?: boolean
}

export function jsonOutput(options: JsonOutputOptions = {}): Plugin {
	const {
		indent = `    `,
		replacer,
		respectCompact = true
	} = options

	return {
		name: PLUGIN_NAME,
		version: PLUGIN_VERSION,

		async generateBundle(outputOptions, bundle) {
			for (const [fileName, chunk] of Object.entries(bundle)) {
				if (chunk.type !== `chunk` || !chunk.isEntry) {
					continue
				}

				// Import the bundled code by converting it to a data URI
				const base64 = new TextEncoder().encode(chunk.code).toBase64()
				const dataUri = `data:text/javascript;base64,${base64}`

				let module: Record<string, unknown>
				try {
					module = await import(dataUri)
				} catch (error) {
					const message = error instanceof Error ? error.message : String(error)
					this.error(`Failed to import \`${chunk.fileName}\`: ${message}`)
				}

				const value = module.default
				if (value === undefined) {
					this.error(`Module \`${chunk.fileName}\` has no default export.`)
				}

				const compact = respectCompact && (
					outputOptions.compact ||                                     // Rollup
					(outputOptions as unknown as Record<string, unknown>).minify // Rolldown
				)
				const effectiveIndent = compact ? undefined : (indent ?? undefined)

				let json: string
				try {
					json = JSON.stringify(value, replacer, effectiveIndent)
				} catch (error) {
					const message = error instanceof Error ? error.message : String(error)
					this.error(`Failed to serialize default export of \`${chunk.fileName}\` to JSON: ${message}`)
				}

				// Replace the JS chunk with JSON asset
				delete bundle[fileName]
				const jsonFileName = fileName.replace(/(?<=\.)[cm]?js$/, `json`)
				this.emitFile({
					type: `asset`,
					fileName: jsonFileName,
					source: json
				})
			}
		},
	}
}
