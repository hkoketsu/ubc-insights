import {InsightDatasetKind, InsightError} from "../../../controller/IInsightFacade";
import {MFieldCourse, MFieldRoom, SFieldCourse, SFieldRoom} from "../../domain/QueryComponent";

export default class QueryOptionsValidator {
    private columnEntries: string[] = [];

    public validate(options: any, id: string, kind: InsightDatasetKind, hasTrans: boolean): void {
        if (Object.keys(options).length > 2 || (Object.keys(options).length === 2 && options.ORDER === undefined)) {
            throw new InsightError("Invalid keys in OPTIONS");
        }
        try {
            this.validateColumns(options.COLUMNS, id, kind, hasTrans);
            if (options.ORDER) {
                this.validateOrders(options.ORDER);
            }
        } catch (e) {
            throw e;
        }
    }

    private validateColumns(columns: any, id: string, kind: InsightDatasetKind, hasTrans: boolean): void {
        // reset column entries
        this.columnEntries = [];
        columns.forEach((column: any) => {
            /*column is the current column string in columns*/
            try {
                this.validateColumn(column, id, kind, hasTrans);
            } catch (e) {
                throw e;
            }
        });
    }

    private validateColumn(column: any, id: string, kind: InsightDatasetKind, hasTrans: boolean): void {
        if (typeof column !== "string") {
            throw new InsightError("columns keys must be string");
        }
        if (hasTrans) {
            this.columnEntries.push(column);
            return;
        }
        if (!column.includes("_")) {
            throw new InsightError("Invalid key " + column + " in COLUMNS");
        }
        const scolumn = column.split("_");
        if (scolumn.length > 2) {
            throw new InsightError("Invalid key " + column + " in COLUMNS");
        }
        if (id !== scolumn[0]) {
            throw new InsightError("Cannot query more than one dataset");
        }
        if (scolumn[0] === "") {
            throw new InsightError("Reference dataset cannot be empty string");
        }
        if ((kind === InsightDatasetKind.Courses && (scolumn[1] in MFieldCourse || scolumn[1] in SFieldCourse))
            || (kind === InsightDatasetKind.Rooms && (scolumn[1] in MFieldRoom || scolumn[1] in SFieldRoom))) {
            this.columnEntries.push(column);
        } else {
            throw new InsightError("Invalid key " + column + " in COLUMNS");
        }
    }

    private validateOrders(order: any): void {
        if (typeof order === "string") {
            if (!this.columnEntries.includes(order)) {
                throw new InsightError("ORDER key must be in COLUMNS");
            }
        } else if (typeof order.dir === "string" && order.keys instanceof Array && order.keys.length > 0) {
            let keys = order.keys;
            let dir = order.dir;
            if (dir !== "UP" && dir !== "DOWN") {
                throw new InsightError("Invalid entry " + dir + " in ORDER");
            }
            keys.forEach((filter: string) => {
                if (!this.columnEntries.includes(filter)) {
                    throw new InsightError("ORDER key must be in COLUMNS");
                }
            });
        } else {
            throw new InsightError("Invalid ORDER type");
        }
    }

    public getColumnEntries(): string[] {
        return this.columnEntries;
    }
}
