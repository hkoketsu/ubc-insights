import Log from "../../Util";
import {ResultTooLargeError} from "../../controller/IInsightFacade";
import {Logic, MComparator, SComparator} from "../domain/QueryComponent";
import Dataset from "../domain/Dataset";

export default class QuerySearchService {
    constructor() {
        Log.trace("QuerySearchService:: init()");
    }

    public querySearch(query: any, dataList: Dataset[], haveTrans: boolean): any[] {
        const searchResult: any[] = [];
        dataList.forEach((curEntry: Dataset) => {
            if (this.queryCondition(query, curEntry)) {
                if (haveTrans) {
                   searchResult.push(curEntry);
                } else {
                    const columnCondition = query.OPTIONS.COLUMNS;
                    const validEntry: { [index: string]: any } = {};
                    columnCondition.forEach((condition: string) => {
                        validEntry[condition] = this.filterKeyChecker(condition, curEntry)[0];
                    });
                    searchResult.push(validEntry);
                }
            }
            if (!haveTrans && searchResult.length > 5000) {
                throw new ResultTooLargeError(
                    "The result is too big. Only queries with a maximum of 5000 results are supported."
                );
            }
        });
        return searchResult;
    }

    private queryCondition(query: any, curEntry: any): boolean {
        if (Object.keys(query.WHERE).length === 0) {
            return true;
        } else {
            return this.filterChecker(query.WHERE, curEntry);
        }
    }

    private filterChecker(filter: any, curEntry: any): boolean {
        const curfilter = Object.keys(filter)[0];
        if (curfilter in Logic) {
            let curCondition = this.filterChecker(filter[curfilter][0], curEntry);
            if (curfilter === Logic.OR) {
                Object.keys(filter.OR).forEach((inFilter: any) => {
                    if (inFilter > 0) {
                        curCondition = curCondition || this.filterChecker(filter.OR[inFilter], curEntry);
                    }
                });
            } else {
                Object.keys(filter.AND).forEach((inFilter: any) => {
                    if (inFilter > 0) {
                        curCondition = curCondition && this.filterChecker(filter.AND[inFilter], curEntry);
                    }
                });
            }
            return curCondition;
        } else if (curfilter in MComparator || curfilter in SComparator) {
            const curKey = this.filterKeyChecker(filter[curfilter], curEntry);
            switch (curfilter) {
                case "LT":
                    return curKey[0] < curKey[1];
                case "GT":
                    return curKey[0] > curKey[1];
                case "EQ":
                    return curKey[0] === curKey[1];
                case "IS":
                    return this.filterIS(curKey);
            }
        } else {
            return !this.filterChecker(filter.NOT, curEntry);
        }
    }

    private filterKeyChecker(filterKey: any, curEntry: any): [any, any] {
        let subFilterKey = "";
        let subFilterValue = "";
        if (typeof filterKey === "string") {
            subFilterKey = filterKey.split("_")[1];
        } else {
            const curFilterKey = Object.keys(filterKey)[0];
            subFilterKey = curFilterKey.split("_")[1];
            subFilterValue = filterKey[Object.keys(filterKey)[0]];
        }
        return [curEntry[subFilterKey], subFilterValue];
    }

    private filterIS(curKey: [any, any]): boolean {
        if (typeof curKey[0] === "number") {
            curKey[0] = curKey[0].toString();
            curKey[1] = curKey[1].toString();
        }
        let queryKey = curKey[0];
        let expectedKey = curKey[1].split("*");
        if (expectedKey.length === 2) {
            if (expectedKey[0] === "") {
                // this checks if the last part of the key is *key
                return queryKey.substr( queryKey.length - expectedKey[1].length) === expectedKey[1];
            } else {
                return queryKey.substr(0, expectedKey[0].length) === expectedKey[0];
            }
        } else if (expectedKey.length === 3) {
            return queryKey.includes(expectedKey[1]);
        }
        return  curKey[0] ===  curKey[1];
    }
}
