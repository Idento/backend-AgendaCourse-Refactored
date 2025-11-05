import { differenceInCalendarDays, parse } from "date-fns";
import * as planningRepo from '../repositories/planningRepository.js'
import * as archiveRepo from '../repositories/saveplanningRepository.js'

export function savePlanning() {
    const allPlannings = planningRepo.selectAllPlanning();

    for (const planning of allPlannings) {
        const planningDate = parse(planning.date, 'dd/MM/yyyy', new Date());
        const todayPlanning = new Date();
        if (differenceInCalendarDays(todayPlanning, planningDate) > 30) {
            try {
                archiveRepo.insertSavePlanning({
                    id: planning.id,
                    driver_id: planning.driver_id,
                    date: planning.date,
                    client_name: planning.client_name,
                    start_time: planning.start_time,
                    destination: planning.destination,
                    return_time: planning.return_time,
                    note: planning.note,
                    long_distance: planning.long_distance,
                    recurrence_id: planning.recurrence_id
                });
                console.log(`------- [INFO] Planning ID:${planning.id},Date ${planning.date}, Client ${planning.client_name} archived successfully.-------`);
                planningRepo.deletePlanningWithId(planning.id);
            } catch (error) {
                console.error("Error archiving planning:", error);
            }
        }
    }
    console.log("Plannings older than 30 days have been archived.");
}