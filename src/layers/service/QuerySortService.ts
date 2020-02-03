import {SFieldCourse, SFieldRoom} from "../domain/QueryComponent";

export default class QuerySortService {
    private query: any;
    public sortEntry(query: any, entryList: any[]): any[] {
        this.query = query;
        const order = query.OPTIONS.ORDER;
        if (!order) {
            return entryList;
        }
        if (typeof order === "string") {
            return this.sorting(order, entryList);
        } else {
            const dir = order.dir;
            const keys = order.keys;
            const result = this.sortingMulti(keys, entryList);
            return dir === "DOWN" ? result.reverse() : result;
        }
    }

    private sorting(key: any, entryList: any[]): any[] {
        const sortType = this.getSortBaseType(key);
        if (sortType === "string") {
            return entryList.sort((a, b) => this.compareString(a[key], b[key]));
        } else {
            return entryList.sort((a, b) => a[key] - b[key]);
        }
    }

    private sortingMulti(keys: any, entryList: any[]): any[] {
        let key = keys[0];
        let subKeys = keys.slice( 1, keys.length);
        const sortType = this.getSortBaseType(key);
        if (sortType === "string") {
            return entryList.sort((a, b) => {
                if (this.compareString(a[key], b[key]) === 0 && subKeys.length > 0) {
                    return this.sortHelper(subKeys, a, b);
                }
                return this.compareString(a[key], b[key]);
            });
        } else {
            return entryList.sort((a, b) => {
                if (a[key] - b[key] === 0 && subKeys.length > 0) {
                    return this.sortHelper(subKeys, a, b);
                }
                return a[key] - b[key];
            });
        }
    }

    private sortHelper (keys: any, a: any, b: any): number {
        let key = keys[0];
        let subKeys = keys.slice( 1, keys.length);
        const sortType = this.getSortBaseType(key);
        if (sortType === "string") {
            if (this.compareString(a[key], b[key]) === 0 && subKeys.length > 0) {
                return this.sortHelper(subKeys, a, b);
            }
            return this.compareString(a[key], b[key]);
        } else {
            if (a[key] - b[key] === 0 && subKeys.length > 0) {
                return this.sortHelper(subKeys, a, b);
            }
            return a[key] - b[key];
        }
    }

    private getSortBaseType(key: string) {
        let filterKey = key;
        if (key.indexOf("_") === -1) {
            this.query.TRANSFORMATIONS.APPLY.forEach((rule: any) => {
                let applyKey = Object.keys(rule)[0];
                let filter = rule[applyKey][Object.keys(rule[applyKey])[0]];
                if (filterKey === applyKey) {
                    filterKey = filter;
                    return;
                }
            });
        }
        filterKey = filterKey.split("_")[1];
        if (filterKey in SFieldCourse || filterKey in SFieldRoom) {
            return "string";
        } else {
            return "number";
        }
    }

    private compareString(a: string, b: string): number {
        if (typeof a === "undefined") {
            return -1;
        }
        if (typeof b === "undefined") {
            return 1;
        }
        return a.toString().localeCompare(b.toString());
    }
}
