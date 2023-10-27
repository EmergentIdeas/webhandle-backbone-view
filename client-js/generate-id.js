/**
 * Generates a random string id in the browser. Will probably not work
 * on the server.
 * @returns A base64 web url safe string
 */
export default function generateId() {
	let array = new Uint8Array(32)
	window.crypto.getRandomValues(array)
	let value = btoa(array)
	value = value.replace(/\//g, "_").replace(/\+/g, "-").replace(/=+$/, "")
	return value
}