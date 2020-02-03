import {InsightDatasetKind, InsightError} from "../../../controller/IInsightFacade";
import {MFieldCourse, MFieldRoom, SFieldCourse, SFieldRoom} from "../../domain/QueryComponent";

export default class QueryOutShellValidator {
    private queriedId: string;
    private queriedKind: InsightDatasetKind;
    private hasTrans: boolean;
    public validate(query: any): void {
        try {
            this.validateQueryFormat(query);
            this.validateConditionFormat(query.WHERE);
            this.validateOptionsFormat(query.OPTIONS);
            const trans = query.TRANSFORMATIONS;
            let validDataKey = query.OPTIONS.COLUMNS[0];
            if (trans !== undefined && Object.keys(query).length === 3) {
                this.validateTransFormat(trans);
                validDataKey = query.TRANSFORMATIONS.GROUP[0];
                this.hasTrans = true;
            } else {
                this.hasTrans = false;
            }
            this.queriedId = validDataKey.split("_")[0];
            this.setQueriedKind(validDataKey.split("_")[1]);
        } catch (e) {
            throw e;
        }
    }

    public hasTransformations(): boolean {
        return this.hasTrans;
    }

    public getQueriedDatasetId(): string {
        return this.queriedId;
    }

    public getQueriedDatasetKind(): InsightDatasetKind {
        return this.queriedKind;
    }

    private validateQueryFormat(query: any): void {
        if (query === null) {
            throw new InsightError("Query must be object");
        }
        if (Object.keys(query).length > 3) {
            throw new InsightError("Excess keys in query");
        }
    }

    private validateConditionFormat(where: any) {
        if (where === undefined) {
            throw new InsightError("Missing WHERE");
        }
    }

    private validateOptionsFormat(options: any) {
        if (options === undefined) {
            throw new InsightError("Missing OPTIONS");
        }
        if (options.COLUMNS === undefined) {
            throw new InsightError("OPTIONS missing COLUMNS");
        }
        if (!(options.COLUMNS instanceof Array) || options.COLUMNS.length === 0) {
            throw new InsightError("COLUMNS must be a non empty array.");
        }
    }

    private validateTransFormat(trans: any) {
        if (trans.GROUP === undefined) {
            throw new InsightError("TRANSFORMATION missing GROUP");
        } else if (!(trans.GROUP instanceof Array) || trans.GROUP.length === 0) {
            throw new InsightError("GROUP must be a non empty array");
        }
        if (trans.APPLY === undefined) {
            throw new InsightError("TRANSFORMATION missing APPLY");
        } else if (!(trans.APPLY instanceof Array)) {
            throw new InsightError("APPLY must be an array");
        }
        if (Object.keys(trans).length > 2) {
            throw new InsightError("Excess keys in TRANSFORMATION");
        }
    }

    private setQueriedKind(key: string) {
        if (key in MFieldCourse || key in SFieldCourse) {
            this.queriedKind = InsightDatasetKind.Courses;
        } else if (key in MFieldRoom || key in SFieldRoom) {
            this.queriedKind = InsightDatasetKind.Rooms;
        } else {
            throw new InsightError("invalid key");
        }
    }
}
