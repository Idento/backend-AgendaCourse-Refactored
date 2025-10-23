import * as noteRepo from '../repositories/notesRepository.js'


/**
 * Récupération d'une note en fonction de la date
 * @param {string} date 
 * @returns {Promise<Object/>}
 */
export async function getSingleNotesWithDate(date) {
    const note = noteRepo.selectNoteWithDate(date)
    if (!note) {
        addNoteWithDate(date, '')
        return
    }
    return note
}

/**
 * Récupération des notes en fonction des dates reçu
 * @param {string} dates 
 * @returns {Promise<object[]/>}
 */
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

/**
 * Ajout d'une note a la date recu
 * @param {string} date 
 * @param {string} note 
 * @returns {Promise<number/>}
 */
export async function addNoteWithDate(date, note) {
    const exists = noteRepo.selectNoteWithDate(date)
    let data;
    if (exists) {
        data = noteRepo.updateNoteWithDate(date, note)
    } else {
        data = noteRepo.insertNote(date, note)
    }
    return data?.lastInsertRowid
}


/**
 * Modification de la note a la date donnée
 * @param {string} date 
 * @param {string} note 
 * @returns {Promise<number/>}
 */
export async function updateNoteWithDate(date, note) {
    const data = noteRepo.updateNoteWithDate(date, note)
    return data.lastInsertRowid
}

/**
 * Fonction servant globalement permettant d'initialiser des notes non existant ou mettre a jour si existante
 * @param {string} date 
 * @param {string} note 
 */
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