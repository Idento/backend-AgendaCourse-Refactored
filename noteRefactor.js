//MAINDB
//Driver
'SELECT * FROM driver'
'INSERT INTO driver (name, color) VALUES (?, ?)'
'UPDATE driver SET name = ?, color = ? WHERE id = ?'
'DELETE FROM driver WHERE id = ?'

//Planning
'SELECT * FROM planning'
'SELECT * FROM planning WHERE id = ?'
'SELECT * FROM planning WHERE driver_id = ? AND date = ?'
'SELECT * FROM planning WHERE recurrence_id = ? AND date = ?'
'SELECT * FROM planning WHERE recurrence_id = ?'
'SELECT * FROM planning WHERE date = ?'
'SELECT * FROM planning WHERE date IN (' + allWeekDays.map(() => '?').join(',') + ')'
'SELECT id, recurrence_id FROM planning'
    `INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    `INSERT INTO planning (driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    `UPDATE planning SET driver_id = ?, client_name = ?, start_time = ?, return_time = ?, note = ?, destination = ?, long_distance = ?, recurrence_id = ? WHERE id = ?`
    `UPDATE planning SET driver_id = ?, date = ?, client_name = ?, start_time = ?, return_time = ?, note = ?, destination = ?, long_distance = ?, recurrence_id = ? WHERE id = ?`
'UPDATE planning SET recurrence_id = ? WHERE id = ?'
'DELETE FROM planning WHERE id = ?'

//Notes
'SELECT * FROM notes WHERE date = ?' * 2
'INSERT INTO notes (date, note) VALUES (?, ?)'
'UPDATE notes SET note = ? WHERE date = ?'


//recurrence
'SELECT * FROM recurrence'
'SELECT * FROM recurrence WHERE id = ?'
'SELECT frequency FROM recurrence WHERE id = ?'
'INSERT INTO recurrence (frequency, start_date, next_day) VALUES (?, ?, ?)'
'UPDATE recurrence SET start_date = ?, next_day = ? WHERE id = ?'
'UPDATE recurrence SET frequency = ?, start_date = ?, next_day = ? WHERE id = ?'
'UPDATE recurrence SET frequency = ?, next_day = ? WHERE id = ?'
'DELETE FROM recurrence WHERE id = ?'

//recurrence_excludeddays
'SELECT * FROM recurrence_excludedays'
'SELECT * FROM recurrence_excludedays WHERE recurrence_id = ?'
'INSERT INTO recurrence_excludedays (recurrence_id, date) VALUES (?, ?)'
'UPDATE recurrence_excludedays SET date = ? WHERE recurrence_id = ?'
'DELETE FROM recurrence_excludedays WHERE recurrence_id = ?'

    //other
    `SELECT p.*, r.frequency FROM planning p LEFT JOIN recurrence r ON p.recurrence_id = r.id WHERE p.date = ?`

//USER
//User
'SELECT * FROM user WHERE username = ?'
'SELECT username, role FROM user'
'INSERT INTO user (username, password, role) VALUES (?, ?, ?)'
'UPDATE user SET role = ? WHERE username = ?'
'UPDATE user SET password = ? WHERE username = ?'
'DELETE FROM user WHERE username = ?'

    //ARCHIVEDDB
    //saved_planning
    `INSERT INTO saved_planning (id, driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

/*
1. Ajout simple (sans récurrence)
    L’élément est ajouté une seule fois dans la base de données.
    Aucun traitement de récurrence n’est déclenché.
    L’enregistrement n’est pas associé à une structure de récurrence.

2. Ajout avec récurrence
    Lors de l’ajout, si une récurrence est définie :
        Le système génère automatiquement les occurrences suivantes à partir de la date de départ (startDate).
        Les occurrences sont créées selon le schéma défini (quotidien, hebdomadaire, etc.).
        Une entrée principale de récurrence est enregistrée, contenant :
            la date de départ,
            la prochaine occurrence (nextDate),
            le modèle de récurrence (jours, fréquence, etc.).
            Ces données permettent de maintenir et de recalculer les occurrences futures.

3. Modification d’une donnée récurrente
    Lorsqu’une donnée associée à une récurrence est modifiée :
        Le système compare le tableau de fréquence ou les paramètres de récurrence actuels avec les nouveaux.
            Si un changement est détecté :
                La récurrence est recalculée à partir de la date actuelle ou de la date modifiée.
                Les occurrences obsolètes sont supprimées ou ajustées selon le nouveau schéma.
                Si aucun changement structurel n’est constaté, seules les données spécifiques à la modification sont mises à jour.

4. Suppression d’une occurrence isolée (sans supprimer la récurrence)
    Lorsqu’un utilisateur supprime une seule occurrence d’une série récurrente :
        La date supprimée est ajoutée à la liste des exclusions pour cette récurrence.
        Le système recalcule les occurrences futures, en excluant les dates présentes dans cette liste.
        Cela empêche la réapparition automatique de cette occurrence lors d’un futur recalcul.

5. Suppression complète d’une récurrence
    Lorsqu’un utilisateur souhaite supprimer l’intégralité de la récurrence :
        Toutes les occurrences associées sont supprimées de la base de données.
        L’entrée principale représentant la récurrence est également effacée définitivement.
        Plus aucune génération automatique ne sera déclenchée pour cette récurrence.
*/