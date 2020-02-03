import QueryOutShellValidator from "./QueryOutShellValidator";
import QueryBodyValidator from "./QueryBodyValidator";
import QueryOptionsValidator from "./QueryOptionsValidator";
import QueryTransValidator from "./QueryTransValidator";
import {InsightDataset, InsightDatasetKind, InsightError} from "../../../controller/IInsightFacade";

export default class QueryValidationService {
    private queryOutShellValidator: QueryOutShellValidator;
    private queryBodyValidator: QueryBodyValidator;
    private queryOptionsValidator: QueryOptionsValidator;
    private queryTransValidator: QueryTransValidator;
    constructor() {
        this.queryOutShellValidator = new QueryOutShellValidator();
        this.queryBodyValidator = new QueryBodyValidator();
        this.queryOptionsValidator = new QueryOptionsValidator();
        this.queryTransValidator = new QueryTransValidator();
    }

    public validate(query: any, datasetInfo: InsightDataset[]): void {
        try {
            this.queryOutShellValidator.validate(query);
            this.validateQueriedDatasetIsAdded(datasetInfo);
            const queriedId = this.getQueriedDatasetId();
            const queriedKind = this.getQueriedDatasetKind();
            const hasTrans = this.hasTransformations();
            this.queryBodyValidator.validate(query.WHERE, queriedId, queriedKind);
            this.queryOptionsValidator.validate(query.OPTIONS, queriedId, queriedKind, hasTrans);
            if (query.TRANSFORMATIONS) {
                const columns = this.queryOptionsValidator.getColumnEntries();
                this.queryTransValidator.validate(query.TRANSFORMATIONS, queriedId, queriedKind, columns);
            }
        } catch (e) {
            throw e;
        }
    }

    public validateQueriedDatasetIsAdded(datasetInfo: InsightDataset[]): void {
        const queriedId = this.getQueriedDatasetId();
        if (datasetInfo.filter((dataset) => dataset.id === queriedId).length === 0) {
            throw new InsightError("Referenced dataset id \"" + queriedId + "\" not added yet");
        }
    }

    public getQueriedDatasetId(): string {
        return this.queryOutShellValidator.getQueriedDatasetId();
    }

    public getQueriedDatasetKind(): InsightDatasetKind {
        return this.queryOutShellValidator.getQueriedDatasetKind();
    }

    public hasTransformations(): boolean {
        return this.queryOutShellValidator.hasTransformations();
    }
}
