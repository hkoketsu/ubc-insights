import Dataset from "./Dataset";

export default class Course extends Dataset {
    public readonly title: string | undefined;
    public readonly id: string;
    public readonly uuid: string | undefined;
    public readonly instructor: string | undefined;
    public readonly audit: number | undefined;
    public readonly year: number | undefined;
    public readonly pass: number | undefined;
    public readonly fail: number | undefined;
    public readonly avg: number | undefined;
    public readonly dept: string | undefined;
    public readonly section: string;
    constructor(
        title: string | undefined,
        id: string,
        uuid: string | undefined,
        instructor: string | undefined,
        audit: number | undefined,
        year: number | undefined,
        pass: number | undefined,
        fail: number | undefined,
        avg: number | undefined,
        dept: string | undefined,
        section: string
    ) {
        super();
        this.title = title;
        this.id = id;
        this.uuid = uuid;
        this.instructor = instructor;
        this.audit = audit;
        this.year = year;
        this.pass = pass;
        this.fail = fail;
        this.avg = avg;
        this.dept = dept;
        this.section = section;
    }

    private static toCourse(json: ICourseJSON): Course {
        return new Course(
            json.Title,
            json.Course,
            json.id.toString(),
            json.Professor,
            json.Audit,
            json.Section === "overall" ? 1900 : +json.Year,
            json.Pass,
            json.Fail,
            json.Avg,
            json.Subject,
            json.Section
        );
    }

    public static toCourses(coursesJson: ICourseJSON[]): Course[] {
        const courses: Course[] = [];
        for (const courseJson of coursesJson) {
            courses.push(Course.toCourse(courseJson));
        }
        return courses;
    }

    public isIdentical(otherCourse: Course): boolean {
        return this.uuid === otherCourse.uuid;
    }
}

interface ICourseJSON {
    Title: string | undefined;
    Course: string | undefined;
    id: number | undefined;
    Professor: string | undefined;
    Audit: number | undefined;
    Year: string | undefined;
    Pass: number | undefined;
    Fail: number | undefined;
    Avg: number | undefined;
    Subject: string | undefined;
    Section: string | undefined;
}
