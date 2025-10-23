export function toArray(data) {
    let result = data

    for (let i = 0; i < 3; i++) {
        if (result == null) return []
        if (Array.isArray(result)) return result
        if (typeof result === 'string') {
            try {
                result = JSON.parse(result)
                continue
            } catch {
                return [result]
            }
        }
        if (typeof result === 'number') return [result]
        if (typeof result === 'object') return [result]
    }

    return Array.isArray(result) ? result : []
}