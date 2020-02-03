import {expect} from "chai";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import HttpService from "../src/layers/service/HttpService";
import GeographicalCoordinate from "../src/layers/domain/GeographicalCoordinate";
import {IncorrectAddressError} from "../src/layers/domain/Error/IncorrectAddressError";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        rooms: "./test/data/rooms.zip",
        noCourseSection: "./test/data/noCourseSection.zip",
        notZip: "./test/data/AANB500.txt",
        empty: "./test/data/empty.zip",
        noData: "./test/data/noData.zip",
        oneCourse: "./test/data/oneCourse.zip",
        oneNoProf: "test/data/oneNoProf.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    describe("Add", () => {
        describe("valid case", function () {
            it("Should add a valid dataset (courses)", function () {
                const id: string = "courses";
                const expected: string[] = [id];
                return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
                    .then((result) => {
                        expect(result).to.deep.equal(expected);
                    })
                    .catch((err: any) => {
                        expect.fail(err, expected, "Should not have rejected");
                    });
            });
            it("Should add a valid dataset (rooms)", function () {
                const id: string = "rooms";
                const expected: string[] = [id];
                return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms)
                    .then((result: string[]) => {
                        expect(result).to.deep.equal(expected);
                    }).catch((err: any) => {
                        expect.fail(err, expected, "Should not have rejected");
                    });
            });
            it("Should pass if id is something valid", function () {
                const id: string = "courses2";
                const id0: string = "courses";
                const expected: string[] = [id];
                return insightFacade.addDataset(id, datasets[id0], InsightDatasetKind.Courses)
                    .then((result: string[]) => {
                        expect(result).to.deep.equal(expected);
                    }).catch((err: any) => {
                        expect.fail(err, expected, "Should not have rejected");
                    });
            });
            describe("valid dataset", () => {
                const ids = ["oneCourse", "oneNoProf"];
                for (const id of ids) {
                    it(`id: ${id}`, () => {
                        const expected = [id];
                        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
                            .then((result) => {
                                expect(result).deep.equal(expected);
                            })
                            .catch((e) => expect.fail(e));
                    });
                }
            });
        });
        describe("invalid case", () => {
            describe("invalid id", () => {
                const courseId = "courses";
                it("Should fail in adding any dataset (underscore)", function () {
                    const id: string = "cours_es";
                    return insightFacade.addDataset(id, datasets[courseId], InsightDatasetKind.Courses)
                        .then((result: string[]) => {
                            expect.fail(result, InsightError, "Should not have passed");
                        }).catch((err: any) => {
                            expect(err).to.be.instanceOf(InsightError);
                        });
                });
                it("Should fail in adding any dataset (whitespace)", function () {
                    const id: string = "     ";
                    return insightFacade.addDataset(id, datasets[courseId], InsightDatasetKind.Courses)
                        .then((result: string[]) => {
                            expect.fail(result, InsightError, "Should not have passed");
                        }).catch((err: any) => {
                            expect(err).to.be.instanceOf(InsightError);
                        });
                });
                it("should not add a dataset with a null id", function () {
                    const id: string = null;
                    return insightFacade.addDataset(id, datasets[courseId], InsightDatasetKind.Courses)
                        .then(() => {
                            expect.fail("Should not have added a dataset with a null id");
                        })
                        .catch((err: any) => {
                            expect(err).to.be.instanceOf(InsightError);
                        });
                });
                it("Should fail in adding any dataset (empty)", function () {
                    const id: string = "";
                    const id0: string = "courses";
                    return insightFacade.addDataset(id, datasets[id0], InsightDatasetKind.Courses)
                        .then((result: string[]) => {
                            expect.fail(result, InsightError, "Should not have passed");
                        }).catch((err: any) => {
                            expect(err).to.be.instanceOf(InsightError);
                        });
                });
            });
            it("Should not change the dataset dataset (already added)", function () {
                const id: string = "courses";
                const expected: string[] = [id];
                return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
                    .then((result: string[]) => {
                        expect(result).to.deep.equal(expected);
                        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
                    })
                    .then((res: string[]) => {
                        expect.fail(res, InsightError, "Should not have passed");
                    })
                    .catch((err: any) => {
                        expect(err).to.be.instanceOf(InsightError);
                    });
            });
            describe("invalid kind", () => {
                it("Should not add a valid course dataset if kind is wrong", function () {
                    const id: string = "courses";
                    return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms)
                        .then((result: string[]) => {
                            expect.fail(result, InsightError, "Should not have added");
                        }).catch((err: any) => {
                            expect(err).to.be.instanceOf(InsightError);
                        });
                });

                it("Should not add a valid room dataset if kind is wrong", function () {
                    const id: string = "rooms";
                    return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
                        .then((result: string[]) => {
                            expect.fail(result, InsightError, "Should not have added");
                        }).catch((err: any) => {
                            expect(err).to.be.instanceOf(InsightError);
                        });
                });
            });
            describe("invalid dataset", () => {
                const invalidIds = ["noCourseSection", "notZip", "empty", "noData"];
                for (const id of invalidIds) {
                    it(`id: ${id}`, () => {
                        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
                            .then(() => expect.fail())
                            .catch((e) => expect(e).to.be.instanceOf(InsightError));
                    });
                }
            });
        });
    });

    describe("remove", () => {
        describe("valid", () => {
            it("Should remove a valid dataset (courses)", function () {
                const id: string = "courses";
                return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
                    .then(() => {
                        return insightFacade.removeDataset(id);
                    })
                    .then((res) => {
                        expect(res).to.deep.equal(id);
                        expect(fs.readdirSync("./data").length).deep.equal(0);
                    })
                    .catch((err: any) => {
                        expect.fail(err, id, "Should not have rejected");
                    });
            });
            it("Should remove a valid dataset (rooms)", function () {
                const id: string = "rooms";
                return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms)
                    .then((ids) => {
                        expect(ids.length).deep.equal(1);
                        return insightFacade.removeDataset(ids[0]);
                    })
                    .then((res) => {
                        expect(res).to.deep.equal(id);
                        expect(fs.readdirSync("./data").length).deep.equal(0);
                    })
                    .catch((err: any) => {
                        expect.fail(err, id, "Should not have rejected");
                    });
            });
        });
        describe("invalid id", () => {
            it("Should not be possible to remove a dataSet (whitespace)", function () {
                const id: string = "      ";
                return insightFacade.removeDataset(id)
                    .then((result: string) => {
                        expect.fail(result, InsightError, "Should not have passed");
                    }).catch((err: any) => {
                        expect(err).to.be.instanceOf(InsightError);
                    });
            });
            it("Should not be possible to remove a dataSet (null)", function () {
                const id: string = null;
                return insightFacade.removeDataset(id)
                    .then((result: string) => {
                        expect.fail(result, InsightError, "Should not have passed");
                    }).catch((err: any) => {
                        expect(err).to.be.instanceOf(InsightError);
                    });
            });
            it("Should not be possible to remove a dataSet (empty)", function () {
                const id: string = "";
                return insightFacade.removeDataset(id)
                    .then((result: string) => {
                        expect.fail(result, InsightError, "Should not have passed");
                    }).catch((err: any) => {
                        expect(err).to.be.instanceOf(InsightError);
                    });
            });
            it("Should not be possible to remove a dataSet (underscore)", function () {
                const id: string = "cour_ses";
                return insightFacade.removeDataset(id)
                    .then((result: string) => {
                        expect.fail(result, InsightError, "Should not have passed");
                    }).catch((err: any) => {
                        expect(err).to.be.instanceOf(InsightError);
                    });
            });
            it("Should not be possible to remove a dataSet (end with underscore)", function () {
                const id: string = "courses_";
                return insightFacade.removeDataset(id)
                    .then((result: string) => {
                        expect.fail(result, InsightError, "Should not have passed");
                    }).catch((err: any) => {
                        expect(err).to.be.instanceOf(InsightError);
                    });
            });
        });
        describe("not existing id", () => {
            it("Should not be possible to remove a non-existing dataSet", function () {
                const id: string = "courses";
                return insightFacade.removeDataset(id)
                    .then((result: string) => {
                        expect.fail(result, NotFoundError, "Should not have passed");
                    }).catch((err: any) => {
                        expect(err).to.be.instanceOf(NotFoundError);
                    });
            });
        });
    });

    describe("geolocation", () => {
        it("Should be valid to get a geographical coordinate", () => {
            const httpService = new HttpService();
            const expected = new GeographicalCoordinate(49.26125, -123.24807);
            return httpService.getGeographicalCoordinate("6245 Agronomy Road V6T 1Z4")
                .then((result) => {
                    expect(result).deep.equal(expected);
                }).catch((e) => {
                    expect.fail(e, expected, "Should not have rejected");
                });
        });
        it("Should not be valid for getting geographical coordinate when address is not correct", () => {
            const httpService = new HttpService();
            return httpService.getGeographicalCoordinate("6245 Agronomy Ro")
                .then((result) => {
                    expect.fail(result, IncorrectAddressError, "Should not have passed");
                }).catch((e) => {
                    expect(e).to.be.instanceOf(IncorrectAddressError);
                });
        });
    });
    describe("list", () => {
        it ("should list dataset information even if empty", function () {
            const expected: InsightDataset[] = [];
            return insightFacade.listDatasets()
                .then((actual) => {
                    expect(actual).deep.equal(expected);
                })
                .catch((err: any) => {
                    expect.fail(err, expected, "Should not have rejected");
                });
        });
        it ("should list the added dataset information", function () {
            const id: string = "courses";
            const expected: InsightDataset[] = [{
                id: "courses",
                kind: InsightDatasetKind.Courses,
                numRows: 64612
            }];
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
                .then(() => {
                    return insightFacade.listDatasets();
                })
                .then((actual) => {
                    expect(actual.length).deep.equal(expected.length);
                    expect(actual[0]).deep.equal(expected[0]);
                })
                .catch((err: any) => {
                    expect.fail(err, expected, "Should not have rejected");
                });
        });
    });
});


/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: any } = {
        courses: {id: "courses", path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
        rooms: {id: "rooms", path: "./test/data/rooms.zip", kind: InsightDatasetKind.Rooms}
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];
    const cacheDir = __dirname + "/../data";

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        fs.removeSync(cacheDir);
        fs.mkdirSync(cacheDir);
        insightFacade = new InsightFacade();
        for (const key of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[key];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(ds.id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises);
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("Should not run test query after removing dataset", () => {
        const promises: Array<Promise<string>> = [];
        for (const key of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[key];
            promises.push(insightFacade.removeDataset(ds.id));
        }
        Promise.all(promises).then(() => {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    insightFacade.performQuery(test.query).then(() => {
                        expect.fail();
                    }).catch((err) => {
                        expect(err).to.be.instanceOf(InsightError);
                    });
                });
            }
        });
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                // if (test.filename === "test/queries/validRoomSimple.json") {
                    it(`[${test.filename}] ${test.title}`, function (done) {
                        insightFacade.performQuery(test.query).then((result) => {
                            TestUtil.checkQueryResult(test, result, done);
                        }).catch((err) => {
                            TestUtil.checkQueryResult(test, err, done);
                        });
                    });
                // }
            }
        });
    });
});
