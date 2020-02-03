import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../../controller/IInsightFacade";
import CourseDatasetService from "../service/dataset/CourseDatasetService";
import DatasetValidationService from "../service/DatasetValidationService";
import RoomDatasetService from "../service/dataset/RoomDatasetService";
import DatasetService from "../service/dataset/DatasetService";
import DatabaseController from "./DatabaseController";
import Dataset from "../domain/Dataset";

export default class DatasetController {
    private datasetService: DatasetService;
    private validationService: DatasetValidationService;
    private databaseController: DatabaseController;
    constructor() {
        this.datasetService = new CourseDatasetService();
        this.validationService = new DatasetValidationService();
        this.databaseController = new DatabaseController();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            try {
                this.validateId(id);
            } catch (e) {
                reject(e);
            }
            if (this.databaseController.existsId(id)) {
                reject(new InsightError(`The dataset is already added (id: ${id})`));
            }
            this.setService(kind);
            this.datasetService
                .load(id, content, kind)
                .then((dataset) => {
                    this.databaseController.set(kind, id, dataset);
                    const keys = this.databaseController.getAllIds();
                    resolve(keys);
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }

    public removeDataset(id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            try {
                this.validateId(id);
            } catch (e) {
                reject(e);
            }
            if (!this.databaseController.existsId(id)) {
                reject(new NotFoundError("The dataset is not added yet"));
            }
            this.datasetService.remove(id)
                .then((key) => resolve(key))
                .catch((e) => reject(e));
        });
    }

    public getDatasetInformation(): InsightDataset[] {
        try {
            return this.databaseController.getInfo();
        } catch (e) {
            throw e;
        }
    }

    public getDataList(id: string, kind: InsightDatasetKind): Dataset[] {
        return this.databaseController.getListData(id, kind);
    }

    private validateId(id: string): void {
        try {
            this.validationService.validateId(id);
        } catch (e) {
            throw e;
        }
    }

    private setService(kind: InsightDatasetKind): void {
        if (kind === InsightDatasetKind.Courses && !(this.datasetService instanceof CourseDatasetService)) {
            this.datasetService = new CourseDatasetService();
        } else if (kind === InsightDatasetKind.Rooms && !(this.datasetService instanceof RoomDatasetService)) {
            this.datasetService = new RoomDatasetService();
        }
    }
}
