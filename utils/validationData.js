export function toArray(data) {
    if (data == null || data == undefined) return []
    const dataParsed = typeof data === 'string' ? JSON.parse(data) : data;
    const dataValue = typeof dataParsed === 'number' ? [dataParsed] : dataParsed
    return dataValue
}