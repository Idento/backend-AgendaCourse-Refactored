import * as noteRepo from '../repositories/notesRepository'

export async function getSingleNotesWithDate(date) {
    return noteRepo.selectNoteWithDate(date)
}

export async function getWeekNotes(dates) {
    let data = []
    for (const date of dates) {
        const note = getSingleNotesWithDate(date)
        data.push(note)
    }
    return data
}

export async function addNoteWithDate(date, note) {
    noteRepo.insertNote(date, note)
}

export async function updateNoteWithDate(date, note) {
    noteRepo.updateNoteWithDate(date, note)
}

export async function modifyOrAddNote(date, note) {
    const exists = getSingleNotesWithDate(date)
    if (exists) {
        updateNoteWithDate(date, note)
    } else {
        addNoteWithDate(date, note)
    }
}