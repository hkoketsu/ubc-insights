import {InsightDatasetKind, InsightError} from "../../controller/IInsightFacade";
import Course from "../domain/Course";

export default class DatasetValidationService {
    public validateId(id: string) {
        if (!id || id.includes("_") || id.trim() === "") {
            throw new InsightError("Invalid ID");
        }
    }

    public hasSection(courses: Course[]): boolean {
        for (const course of courses) {
            if (course.section) {
                return true;
            }
        }
        return false;
    }
}
