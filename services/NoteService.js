import * as noteRepo from '../repositories/notesRepository.js'

export async function getSingleNotesWithDate(date) {
    const note = noteRepo.selectNoteWithDate(date)
    if (!note) {
        addNoteWithDate(date, '')
        return
    }
    return note
}

export async function getWeekNotes(dates) {
    let data = []
    for (const date of dates) {
        const note = await getSingleNotesWithDate(date)
        if (!note?.note) {
            data.push({ date: date, note: '' })
        } else {
            data.push(note)
        }
    }
    return data
}

export async function addNoteWithDate(date, note) {
    const data = noteRepo.insertNote(date, note)
    return data.lastInsertRowid
}

export async function updateNoteWithDate(date, note) {
    const data = noteRepo.updateNoteWithDate(date, note)
    return data.lastInsertRowid
}

export async function modifyOrAddNote(date, note) {
    const exists = getSingleNotesWithDate(date)
    if (exists) {
        try {
            updateNoteWithDate(date, note)
        } catch {
            console.log('error with update note');
        }
    } else {
        try {
            addNoteWithDate(date, note)
        } catch {
            console.log('error with add note');
        }
    }
}