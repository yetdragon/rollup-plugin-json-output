import simple from "./o.simple.js";

const NAME = `dynamic`;

export default {
	name: NAME,
	version: simple.version,
	date: new Date(`2024-01-01`).toISOString()
};
