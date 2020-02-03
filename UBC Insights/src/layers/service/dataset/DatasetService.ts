import DatasetRepository from "../../repository/DatasetRepository";
import Dataset from "../../domain/Dataset";
import {InsightDatasetKind, NotFoundError} from "../../../controller/IInsightFacade";

export default abstract class DatasetService {
    protected datasetRepository: DatasetRepository;

    protected constructor() {
        this.datasetRepository = new DatasetRepository();
    }

    public abstract load(id: string, content: string, kind: InsightDatasetKind): Promise<Dataset[]>;

    public remove(id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (this.datasetRepository.checkIfFileExists(id)) {
                this.datasetRepository.deleteDataset(id)
                    .then(() => resolve(id))
                    .catch((e) => reject(e));
            } else {
                reject(new NotFoundError(`The file ${id} could not be found`));
            }
        });
    }

    public createJsonFile(fileName: string, dataset: Dataset[], kind: InsightDatasetKind): Promise<void> {
        return this.datasetRepository.writeDatasetToJsonFile(fileName, dataset, kind);
    }
}
