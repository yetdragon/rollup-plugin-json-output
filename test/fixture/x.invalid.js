const obj = {
	name: `invalid`
};

// Create circular reference; causes `JSON.stringify` to throw
obj.self = obj;

export default obj;
