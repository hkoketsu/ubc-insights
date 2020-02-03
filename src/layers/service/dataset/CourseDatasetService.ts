import {InsightDatasetKind, InsightError} from "../../../controller/IInsightFacade";
import Course from "../../domain/Course";
import JSZipService from "../JSZipService";
import DatasetService from "./DatasetService";
import DatasetValidationService from "../DatasetValidationService";
import Dataset from "../../domain/Dataset";

export default class CourseDatasetService extends DatasetService {
    private jszipService: JSZipService;
    private datasetValidationService: DatasetValidationService;
    constructor() {
        super();
        this.jszipService = new JSZipService();
        this.datasetValidationService = new DatasetValidationService();
    }

    public load(id: string, content: string, kind: InsightDatasetKind): Promise<Dataset[]> {
        return new Promise<Dataset[]>((resolve, reject) => {
            if (kind !== InsightDatasetKind.Courses) {
                reject(new InsightError(`The dataset kind should be courses but is ${kind}`));
            }
            this.jszipService
                .decodeZipData(content, kind)
                .then((texts) => {
                    return this.convertTextsToCourses(texts);
                })
                .then((courseData) => {
                    this.createJsonFile(id, courseData, kind)
                        .then(() => resolve(courseData));
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }

    private convertTextsToCourses(texts: string[]): Course[] {
        const courseData: Course[] = [];
        for (const text of texts) {
            try {
                const coursesJson = JSON.parse(text).result;
                if (coursesJson) {
                    const courses = Course.toCourses(coursesJson);
                    if (this.datasetValidationService.hasSection(courses)) {
                        courses.forEach((course) => {
                            courseData.push(course);
                        });
                    }
                }
            } catch (e) {
                throw e;
            }
        }
        if (courseData.length === 0) {
            throw new InsightError("The dataset has no valid course");
        }
        return courseData;
    }
}
