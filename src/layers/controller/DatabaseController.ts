import {InsightDataset, InsightDatasetKind} from "../../controller/IInsightFacade";
import Dataset from "../domain/Dataset";

export default class DatabaseController {
    private database: Map<InsightDatasetKind, Map<string, Dataset[]>>;
    constructor() {
        this.database = new Map()
            .set(InsightDatasetKind.Courses, new Map())
            .set(InsightDatasetKind.Rooms, new Map());
    }

    public set(kind: InsightDatasetKind, id: string, dataset: Dataset[]): void {
        if (!this.database.has(kind)) {
            this.database.set(kind, new Map());
        }
        this.database.get(kind).set(id, dataset);
    }

    public getInfo(): InsightDataset[] {
        const info: InsightDataset[] = [];
        const kinds = [...this.database.keys()];
        kinds.forEach((kind) => {
            const dataMap = this.database.get(kind);
            const ids = [...dataMap.keys()];
            ids.forEach((key) => {
                const dataset = dataMap.get(key);
                const insightDataset: InsightDataset = {
                    id: key,
                    kind: kind,
                    numRows: dataset.length
                };
                info.push(insightDataset);
            });
        });
        return info;
    }

    public getAllIds(): string[] {
        const keys: string[][] = [];
        this.database.forEach((map) => {
            keys.push([...map.keys()]);
        });
        return [].concat(...keys);
    }

    public getListData(id: string, kind: InsightDatasetKind): Dataset[] {
        return this.database.get(kind).get(id);
    }

    public existsId(id: string): boolean {
        let hasId = false;
        this.database.forEach((value) => {
            if (value.has(id)) {
                hasId = true;
            }
        });
        return hasId;
    }
}
