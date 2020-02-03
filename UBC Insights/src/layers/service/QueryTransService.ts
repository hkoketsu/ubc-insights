import {Decimal} from "decimal.js";
import {ResultTooLargeError} from "../../controller/IInsightFacade";
export default class QueryTransService {
    private trans: any;
    private query: any;
    private entryList: any;
    private groups: any[];
    private result: any[];
    public transform (query: any, entryList: any): any[] {
        this.result = [];
        this.groups = [];
        this.query = query;
        this.trans = query.TRANSFORMATIONS;
        this.entryList = entryList;
        this.grouping(this.trans.GROUP);
        this.applying(this.trans.APPLY);
        this.formResult();
        if (this.result.length > 5000) {
            throw new ResultTooLargeError(
                "The result is too big. Only queries with a maximum of 5000 results are supported.");
        }
        return this.result;
    }

    private grouping (group: any): void {
        let keys: string[] = [];
        group.forEach((key: string) => {
            keys.push(key.split("_")[1]);
        });
        this.entryList.forEach ((entry: any) => {
            if (this.groups.length === 0) {
                this.groups.push([entry]);
            } else {
                this.findGroup(entry, keys);
            }
        });
    }

    private findGroup (entry: any, keys: string[]): void {
        let foundMatching = false;
        this.groups.forEach((group) => {
            let foundGroup = true;
            keys.forEach((key) => {
                if (group[0][key] !== entry[key]) {
                    foundGroup = false;
                }
            });
            if (foundGroup) {
                group.push(entry);
                foundMatching = true;
                return;
            }
        });
        if (!foundMatching) {
            this.groups.push([entry]);
        }
    }

    private applying (apply: any): void {
        apply.forEach((rule: any) => {
            let applyKey = Object.keys(rule)[0];
            let token = Object.keys(rule[applyKey])[0];
            let field = rule[applyKey][token].split("_")[1];
            this.groups.forEach((group: any) => {
                let result = this.applyRule(group, token, field);
                group[0][applyKey] = result;
            });
        });
    }

    private applyRule (group: any, token: any, field: any): number {
        switch (token) {
            case "MAX":
                return this.getMax(group, field);
                break;
            case "MIN":
                return this.getMin(group, field);
                break;
            case "AVG":
                return this.sumOrAvg(group, field, "avg");
                break;
            case "SUM":
                return this.sumOrAvg(group, field, "sum");
                break;
            case "COUNT":
                return this.getCount(group, field);
        }
        return;
    }

    private getMax (group: any, field: any): number {
        let result = 1;
        group.forEach((entry: any) => {
            if (entry[field] > result) {
                result = entry[field];
            }
        });
        return result;
    }

    private getMin (group: any, field: any): number {
        let result = 999999999999999;
        group.forEach((entry: any) => {
            if (entry[field] < result) {
                result = entry[field];
            }
        });
        return result;
    }

    private sumOrAvg (group: any, field: any, cond: string): number {
        let total = new Decimal(0);
        let avg;
        let res;
        group.forEach((entry: any) => {
            const val = new Decimal(entry[field]);
            total = total.add(val);
            // total.add(new Decimal(entry[field]));
        });
        if (cond === "sum") {
            res = Number(total.toFixed(2));
        } else {
            avg = total.toNumber() / group.length;
            res = Number(avg.toFixed(2));
        }
        return res;
    }

    private getCount (group: any, field: any): number {
        let values: any[] = [];
        group.forEach((entry: any) => {
            if (!values.includes(entry[field])) {
                values.push(entry[field]);
            }
        });
        return values.length;
    }

    private formResult(): void {
        this.groups.forEach((group) => {
            const columnCondition = this.query.OPTIONS.COLUMNS;
            const validEntry: { [index: string]: any } = {};
            columnCondition.forEach((condition: string) => {
                validEntry[condition] = this.filterKeyGetter(condition, group[0]);
            });
            this.result.push(validEntry);
        });
    }

    private filterKeyGetter(filterKey: any, curEntry: any): any {
        let subFilterKey = "";
        if (filterKey.indexOf("_") !== -1) {
            subFilterKey = filterKey.split("_")[1];
        } else {
            subFilterKey = filterKey;
        }
        return curEntry[subFilterKey];
    }
}
