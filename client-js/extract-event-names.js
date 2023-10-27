export default function extractEventNames(eventTriggers) {
	let eventNames = Array.from(eventTriggers.reduce((acc, trigger) => {
		acc.add(trigger.event)
		return acc
	}, new Set()))
	return eventNames
}