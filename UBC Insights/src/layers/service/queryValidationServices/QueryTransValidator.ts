import {InsightDatasetKind, InsightError} from "../../../controller/IInsightFacade";
import {ApplyToken, MFieldCourse, MFieldRoom, SFieldCourse, SFieldRoom} from "../../domain/QueryComponent";

export default class QueryTransValidator {
    private columnEntries: string[];

    public validate(trans: any, id: string, kind: InsightDatasetKind, columns: string[]): void {
        try {
            this.columnEntries = [];
            this.validateTrans(trans, id, kind);
            this.validateOptions(columns);
        } catch (e) {
            throw e;
        }
    }

    private validateTrans (trans: any, id: string, kind: InsightDatasetKind): void {
        this.validateGroup(trans.GROUP, id, kind);
        this.validateApply(trans.APPLY, id, kind);
    }

    private validateGroup (group: any,  id: string, kind: InsightDatasetKind): void {
        for (const key of group) {
            try {
                this.validateKey(key, "GROUP", id, kind);
                this.columnEntries.push(key);
            } catch (e) {
                throw e;
            }
        }
    }

    private validateApply (apply: any, id: string, kind: InsightDatasetKind): void {
        apply.forEach((rule: any) => {
            this.validateRule(rule, id, kind);
        });
    }

    private validateRule (rule: any, id: string, kind: InsightDatasetKind): void {
        if (Object.keys(rule).length !== 1) {
            throw new InsightError("APPLYRULE should only have one applyKey");
        }
        let applyKey = Object.keys(rule)[0];
        if (Object.keys(rule[applyKey]).length !== 1) {
            throw new InsightError("applyKey should only have one Token");
        }
        if (typeof applyKey !== "string") {
            throw new InsightError("applykeys must be string");
        }
        if (applyKey.includes("_")) {
            throw new InsightError("Invalid ApplyKey: " + applyKey);
        }
        let token = Object.keys(rule[applyKey])[0];
        if (token in ApplyToken) {
            const applyKeyFilter = rule[applyKey][token];
            try {
                this.validateKey(applyKeyFilter, "APPLYRULE", id, kind);
            } catch (e) {
                throw e;
            }
            let applyField = applyKeyFilter.split("_")[1];
            if (token !== "COUNT" &&
                !(applyField in MFieldRoom || applyField in MFieldCourse)) {
                throw new InsightError("Invalid key type in " + token);
            }
            if (!this.columnEntries.includes(applyKey)) {
                this.columnEntries.push(applyKey);
            } else {
                throw new InsightError("applyKey is the same in APPLY");
            }
        } else {
            throw new InsightError("Invalid token " + token + "ApplyRule");
        }
    }

    private validateKey (key: any, ogKey: string, id: string, kind: InsightDatasetKind) {
        if (typeof key !== "string") {
            throw new InsightError(ogKey + " keys must be string");
        }
        if (key.indexOf("_") === -1) {
            throw new InsightError("Invalid key " + key + " in " + ogKey);
        }
        let skey = key.split("_");
        if (skey.length > 2) {
            throw new InsightError("Invalid key " + key + " in " + ogKey);
        }
        if (id !== skey[0]) {
            throw new InsightError("Cannot query more than one dataset");
        }
        if (skey[0] === "") {
            throw new InsightError("Reference dataset cannot be empty string");
        }
        if ((kind === InsightDatasetKind.Courses && !(skey[1] in MFieldCourse || skey[1] in SFieldCourse))
            || (kind === InsightDatasetKind.Rooms && !(skey[1] in MFieldRoom || skey[1] in SFieldRoom))) {
            throw new InsightError("Invalid key " + key + " in " + ogKey);
        }
    }

    private validateOptions (entries: any[]): void {
        entries.forEach((entry) => {
            if (!this.columnEntries.includes(entry)) {
                throw new InsightError("Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present");
            }
        });
    }
}
