import { assertEquals, assertExists, assertRejects } from "@std/assert"

import { type RolldownOutput, rolldown } from "rolldown"
import { type OutputAsset, type RollupOutput, rollup } from "rollup"

import { jsonOutput } from "../dist/index.js"

Deno.test(`Basic functionality`, async (t) => {
	const bundle = await rollup({ input: `test/fixture/o.simple.js` })
	const { output } = await bundle.generate({ plugins: [jsonOutput()] })

	await t.step(`serialize default export to JSON`, () => {
		const jsonFile = findJsonFile(output)

		assertExists(jsonFile)
		assertEquals(jsonFile.type, `asset`)
		assertEquals(JSON.parse(jsonFile.source as string), {
			name: `simple`,
			version: `1.0.0`
		})
	})

	await t.step(`remove original JS chunk from bundle`, () => {
		const jsChunks = output.filter(o => o.type === `chunk`)

		assertEquals(jsChunks.length, 0)
	})

	await t.step(`execute dynamic code during bundling`, async () => {
		const bundle = await rollup({ input: `test/fixture/o.dynamic.js` })
		const { output } = await bundle.generate({ plugins: [jsonOutput()] })
		const jsonFile = findJsonFile(output)

		assertExists(jsonFile)
		assertEquals(JSON.parse(jsonFile.source as string), {
			name: `dynamic`,
			version: `1.0.0`,
			date: `2024-01-01T00:00:00.000Z`
		})
	})
})

Deno.test(`Output formatting`, async (t) => {
	const bundle = await rollup({ input: `test/fixture/o.simple.js` })

	await t.step(`respect \`output.compact\` by default`, async () => {
		const { output } = await bundle.generate({
			compact: true,
			plugins: [jsonOutput()]
		})
		const jsonFile = findJsonFile(output)

		assertExists(jsonFile)
		assertEquals(jsonFile.source, `{"name":"simple","version":"1.0.0"}`)
	})

	await t.step(`ignore \`output.compact\` when \`respectCompact\` is false`, async () => {
		const { output } = await bundle.generate({
			compact: true,
			plugins: [jsonOutput({ respectCompact: false })]
		})
		const jsonFile = findJsonFile(output)

		assertExists(jsonFile)
		assertEquals(jsonFile.source, `{\n    "name": "simple",\n    "version": "1.0.0"\n}`)
	})

	await t.step(`respect \`output.minify\` (Rolldown) by default`, async () => {
		const bundle = await rolldown({ input: `test/fixture/o.simple.js` })
		const { output } = await bundle.generate({
			minify: true,
			plugins: [jsonOutput()]
		} as Parameters<typeof bundle.generate>[0])
		const jsonFile = findJsonFile(output)

		assertExists(jsonFile)
		assertEquals(jsonFile.source, `{"name":"simple","version":"1.0.0"}`)
	})
})

Deno.test(`Error handling`, async (t) => {
	await t.step(`module import failure`, async () => {
		const bundle = await rollup({ input: `test/fixture/x.error.js` })
		await assertRejects(
			() => bundle.generate({ plugins: [jsonOutput()] }),
			Error,
			`Failed to import`
		)
	})

	await t.step(`non-serializable value`, async () => {
		const bundle = await rollup({ input: `test/fixture/x.invalid.js` })
		await assertRejects(
			() => bundle.generate({ plugins: [jsonOutput()] }),
			Error,
			`Failed to serialize`
		)
	})

	await t.step(`missing default export`, async () => {
		const bundle = await rollup({ input: `test/fixture/x.no-default.js` })
		await assertRejects(
			() => bundle.generate({ plugins: [jsonOutput()] }),
			Error,
			`has no default export`
		)
	})
})

function findJsonFile(output: (RolldownOutput | RollupOutput)[`output`]): OutputAsset | undefined {
	return output.find(o => o.fileName.endsWith(`.json`)) as OutputAsset | undefined
}
