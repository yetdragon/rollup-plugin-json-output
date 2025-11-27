import {  assertEquals, assertExists, assertRejects } from "@std/assert"

import { type OutputAsset, rollup } from "rollup"

import { jsonOutput } from "../dist/index.js"

Deno.test(`Basic functionality`, async (t) => {
	const bundle = await rollup({ input: `test/fixture/o.simple.js` })
	const { output } = await bundle.generate({ plugins: [jsonOutput()] })

	await t.step(`serialize default export to JSON`, () => {
		const jsonFile = output.find(o => o.fileName.endsWith(`.json`)) as OutputAsset | undefined

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
		const jsonFile = output.find(o => o.fileName.endsWith(`.json`)) as OutputAsset | undefined

		assertExists(jsonFile)
		assertEquals(JSON.parse(jsonFile.source as string), {
			name: `dynamic`,
			version: `1.0.0`,
			date: `2024-01-01T00:00:00.000Z`
		})
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
