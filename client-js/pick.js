/**
 * Duplicates and returns an object with only the speicified keys.
 * @param {object} foucs
 * @param {string[]} keys
 */
export default function pick(focus = {}, keys = []) {
	let clone = {}
	for(let key of keys) {
		if(typeof focus[key] !== 'undefined'){
			clone[key] = focus[key]
		}
	}
	return clone
}