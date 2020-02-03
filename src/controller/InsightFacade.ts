import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import DatasetController from "../layers/controller/DatasetController";
import QueryController from "../layers/controller/QueryController";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private datasetController: DatasetController;
    private queryController: QueryController;

    constructor() {
        const datasetController = new DatasetController();
        this.queryController = new QueryController();
        this.datasetController = datasetController;
        this.queryController.setDatasetController(datasetController);
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            this.datasetController.addDataset(id, content, kind)
                .then((keys) => resolve(keys))
                .catch((e) => reject(e));
        });
    }

    public removeDataset(id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.datasetController.removeDataset(id)
                .then((key) => resolve(key))
                .catch((e) => reject(e));
        });
    }

    public performQuery(query: any): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            this.listDatasets()
                .then((insightDataset) => {
                    return this.queryController.performQuery(query, insightDataset);
                })
                .then((result) => resolve(result))
                .catch((e) => reject(e));
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise<InsightDataset[]>((resolve, reject) => {
            try {
                const info = this.datasetController.getDatasetInformation();
                resolve(info);
            } catch (e) {
                reject(e);
            }
        });
    }
}
