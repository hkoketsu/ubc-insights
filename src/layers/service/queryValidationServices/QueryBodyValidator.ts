import {InsightDatasetKind, InsightError} from "../../../controller/IInsightFacade";
import {
    Logic,
    MComparator,
    MFieldCourse,
    MFieldRoom,
    Negation,
    SComparator,
    SFieldCourse,
    SFieldRoom
} from "../../domain/QueryComponent";

export default class QueryBodyValidator {
    public validate(filter: any, id: string, kind: InsightDatasetKind): void {
        try {
            this.validateFilter(filter, "WHERE", id, kind);
        } catch (e) {
            throw e;
        }
    }

    private validateFilter(filter: any, ogKey: string, id: string, kind: InsightDatasetKind): void {
        if (Object.keys(filter).length === 0  && ogKey === "WHERE") {
            return;
        }
        if (Object.keys(filter).length !== 1) {
            throw new InsightError(ogKey + " should only have 1 key, has " + Object.keys(filter).length);
        }
        const key = Object.keys(filter)[0];
        if (key in Logic) {
            this.validateLogicFilter(filter[key], key, id, kind);
        } else if (key in MComparator || key in SComparator) {
            this.validateKeyFilter(filter[key], key, id, kind);
        } else if (key in Negation) {
            this.validateFilter(filter[key], key, id, kind);
        } else {
            throw new InsightError("Invalid filter key: " + Object.keys(filter)[0]);
        }
    }

    private validateLogicFilter(filter: any, ogKey: string, id: string, kind: InsightDatasetKind): void {
        if (!(filter instanceof Array) || filter.length === 0) {
            throw new InsightError(ogKey + " must be a non empty array");
        }
        filter.forEach((filters) => {
            /*filter is the current filter key in string*/
            try {
                this.validateFilter(filters, Object.keys(filters)[0], id, kind);
            } catch (e) {
                throw e;
            }
        });
    }

    /**
     * This following function validates a single filter key
     */
    private validateKeyFilter(filter: any, ogKey: string, id: string, kind: InsightDatasetKind): void {
        if (Object.keys(filter).length > 1) {
            throw new InsightError(ogKey + " should only have 1 key, has " + Object.keys(filter).length);
        }
        const filterKey = Object.keys(filter)[0]; // e.g. "courses_avg"
        const sfilterKey = filterKey.split("_"); // e.g. "courses_avg" -> ["courses", "avg"]
        const fieldId = sfilterKey[0];
        const fieldKey = sfilterKey[1]; // e.g. dept, uuid, avg
        if (sfilterKey.length !== 2) {
            throw new InsightError("Invalid key " + filterKey + " in " + ogKey);
        }
        /*This checks if the dataset is mentioned more than once*/
        if (id !== fieldId) {
            throw new InsightError("Cannot query more than one dataset");
        }
        const filterValue = filter[filterKey];
        if ((kind === InsightDatasetKind.Courses && fieldKey in SFieldCourse)
            || (kind === InsightDatasetKind.Rooms && fieldKey in SFieldRoom)) {
            if (typeof filterValue !== "string") {
                throw new InsightError("Invalid value type in " + ogKey + ", should be string");
            }
            if (ogKey in MComparator) {
                throw new InsightError("Invalid key type in " + ogKey);
            }
            /*The section here is to check for Asterisk usage correctness*/
            if ((filterValue.split("*").length > 3) ||
                (filterValue.indexOf("*", 1) > 0 && filterValue.indexOf("*", 1) < filterValue.length - 1)) {
                throw new InsightError("Asterisks (*) can only be the first or last characters of input strings");
            }
        } else if ((kind === InsightDatasetKind.Courses && fieldKey in MFieldCourse)
            || (kind === InsightDatasetKind.Rooms && fieldKey in MFieldRoom)) {
            if (typeof filterValue !== "number") {
                throw new InsightError("Invalid value type in " + ogKey + ", should be number");
            }
            if (ogKey in SComparator) {
                throw new InsightError("Invalid key type in " + ogKey);
            }
        } else {
            throw new InsightError("Invalid key " + filterKey + " in " + ogKey);
        }
    }
}
