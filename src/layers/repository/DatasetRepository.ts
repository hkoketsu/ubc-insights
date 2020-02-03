import * as fs from "fs-extra";
import Dataset from "../domain/Dataset";
import {InsightDatasetKind} from "../../controller/IInsightFacade";

export default class DatasetRepository {
    private dataDirectory: string = "./data";

    public writeDatasetToJsonFile(fileName: string, dataset: Dataset[], kind: InsightDatasetKind): Promise<void> {
        const path = this.getDatasetPath(fileName);
        const content = {
            kind: kind,
            dataset: dataset
        };
        const json = JSON.stringify(content);
        return new Promise<void>((resolve, reject) => {
            try {
                fs.writeFileSync(path, json);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    public deleteDataset(fileName: string): Promise<string> {
        const path = this.getDatasetPath(fileName);
        return fs
            .unlink(path)
            .then(() => Promise.resolve(fileName))
            .catch((e) => Promise.reject(e));
    }

    public checkIfFileExists(fileName: string): boolean {
        const datasetPath = this.getDatasetPath(fileName);
        return fs.existsSync(datasetPath);
    }

    protected getDatasetPath(id: string): string {
        return `${this.dataDirectory}/${id}.json`;
    }
}
