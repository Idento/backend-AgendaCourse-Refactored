export function toArray(data) {
    const dataParsed = typeof data === 'string' ? JSON.parse(data) : data;
    const dataValue = typeof dataParsed === 'number' ? [dataParsed] : dataParsed
    return dataValue
}