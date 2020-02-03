import QueryValidationService from "../service/queryValidationServices/QueryValidationService";
import QuerySearchService from "../service/QuerySearchService";
import QuerySortService from "../service/QuerySortService";
import QueryTransService from "../service/QueryTransService";
import {InsightDataset, InsightDatasetKind} from "../../controller/IInsightFacade";
import DatasetController from "./DatasetController";
import Dataset from "../domain/Dataset";

export default class QueryController {
    private validationService: QueryValidationService;
    private searchService: QuerySearchService;
    private sortService: QuerySortService;
    private transService: QueryTransService;
    private datasetController: DatasetController;
    constructor() {
        this.validationService = new QueryValidationService();
        this.searchService = new QuerySearchService();
        this.sortService = new QuerySortService();
        this.transService = new QueryTransService();
    }

    public performQuery(query: any, curDataList: InsightDataset[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            try {
                this.validationService.validate(query, curDataList);
                const queriedId = this.validationService.getQueriedDatasetId();
                const queriedKind = this.validationService.getQueriedDatasetKind();
                const hasTrans = this.validationService.hasTransformations();
                const dataList = this.getDatasetListByQuerySet(queriedId, queriedKind);
                let searchResult = this.searchService.querySearch(query, dataList, hasTrans);
                if (hasTrans) {
                    searchResult =  this.transService.transform(query, searchResult);
                }
                let sortedResult = this.sortService.sortEntry(query, searchResult);
                resolve(sortedResult);
            } catch (e) {
                reject(e);
            }
        });
    }

    public setDatasetController(datasetController: DatasetController): void {
        this.datasetController = datasetController;
    }

    private getDatasetListByQuerySet(id: string, kind: InsightDatasetKind): Dataset[] {
        return this.datasetController.getDataList(id, kind);
    }
}
