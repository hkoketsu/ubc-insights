import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import {expect} from "chai";
import Log from "../src/Util";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind} from "../src/controller/IInsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;
    const SERVER_URL = "http://localhost:4321";

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        server.start()
            .then(() => Log.test("Test server fulfilled"))
            .catch((e) => Log.test(`Test server could not start with ${e}`));
    });

    after(function () {
        server.stop();
    });

    beforeEach(async function () {
        Log.test("Deleting cache...");
        await chai.request(SERVER_URL)
            .post("/cache")
            .then(() => Log.test("Deleting cache complete"))
            .catch((e) => Log.test(e));
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    const datasetToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        rooms: "./test/data/rooms.zip"
    };
    let dataset: { [id: string]: Buffer } = {};
    for (const id of Object.keys(datasetToLoad)) {
        dataset[id] = fs.readFileSync(datasetToLoad[id]);
    }
    it("echo test", () => {
        try {
            return chai.request(SERVER_URL)
                .get("/echo/hello")
                .then((res) => {
                    expect(res.status).to.be.equal(200);
                });
        } catch (e) {
            Log.test("echo test error: " + e);
            expect.fail();
        }
    });

    // Sample on how to format PUT requests
    describe("PUT valid cases", () => {
        const ids = ["courses", "rooms"];
        const kinds = [InsightDatasetKind.Courses, InsightDatasetKind.Rooms];
        for (const index in Array.from(ids)) {
            const id = ids[index];
            const kind = kinds[index];
            it(`id: ${id}, kind: ${kind}`, () => {
                try {
                    return chai.request(SERVER_URL)
                        .put(`/dataset/${id}/${kind}`)
                        .set("Content-Type", "application/x-zip-compressed")
                        .send(dataset[id])
                        .then((res: Response) => {
                            // some logging here please!
                            Log.test("PUT courses dataset response: " + res);
                            expect(res.status).to.be.equal(200);
                            expect(res.body.result).contain(id);
                        })
                        .catch((err) => {
                            // some logging here please!
                            Log.test("Should not have failed: " + err);
                            expect.fail();
                        });
                } catch (err) {
                    // and some more logging here!
                    Log.test("PUT test error: " + err);
                    expect.fail();
                }
            });
        }
    });

    describe("PUT invalid cases: invalid id", () => {
        const ids = ["in_valid", "  "];
        const kinds = [InsightDatasetKind.Courses, InsightDatasetKind.Rooms];
        for (const id of ids) {
            for (const kind of kinds) {
                it(`id: ${id}, kind: ${kind}`, () => {
                    try {
                        return chai.request(SERVER_URL)
                            .put(`/dataset/${id}/${kind}`)
                            .send(dataset[id])
                            .set("Content-Type", "application/x-zip-compressed")
                            .then((res: Response) => {
                                // some logging here please!
                                Log.test("Should have failed: " + res);
                                expect.fail();
                            })
                            .catch((err) => {
                                // some logging here please!
                                Log.test("Should not have failed: " + err);
                                expect(err.status).to.be.equal(400);
                            });
                    } catch (err) {
                        // and some more logging here!
                        Log.test("PUT test error: " + err);
                        expect.fail();
                    }
                });
            }
        }
    });

    it("PUT invalid cases: put same files", () => {
        const id = "courses";
        const kind = InsightDatasetKind.Courses;
        try {
            return chai.request(SERVER_URL)
                .put(`/dataset/${id}/${kind}`)
                .send(dataset[id])
                .set("Content-Type", "application/x-zip-compressed")
                .then((res: Response) => {
                    // some logging here please!
                    Log.test("Should be accepted: " + res);
                    expect(res.status).to.be.equal(200);
                    return chai.request(SERVER_URL)
                        .put(`/dataset/${id}/${kind}`)
                        .send(dataset[id])
                        .set("Content-Type", "application/x-zip-compressed")
                        .then(() => {
                            Log.test("Should have failed: " + res);
                            expect.fail();
                        });
                })
                .catch((err) => {
                    // some logging here please!
                    Log.test("Should not have failed: " + err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
            Log.test("PUT test error: " + err);
            expect.fail();
        }
    });

    it("DELETE valid case", () => {
        const id = "courses";
        const kind = InsightDatasetKind.Courses;
        try {
            return chai.request(SERVER_URL)
                .put(`/dataset/${id}/${kind}`)
                .send(dataset[id])
                .set("Content-Type", "application/x-zip-compressed")
                .then((res: Response) => {
                    // some logging here please!
                    Log.test("Should be accepted: " + res);
                    expect(res.status).to.be.equal(200);
                    return chai.request(SERVER_URL)
                        .del(`/dataset/${id}`)
                        .then((secondRes: Response) => {
                            expect(secondRes.status).to.be.equal(200);
                        });
                })
                .catch((err) => {
                    // some logging here please!
                    Log.test("Should not have failed: " + err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.test("DELETE test error: " + err);
            expect.fail();
        }
    });

    describe("DELETE invalid test cases: invalid id", () => {
        const ids = ["in_valid", "  "];
        for (const id of ids) {
            it(`id: ${id}`, () => {
                try {
                    return chai.request(SERVER_URL)
                        .del(`/dataset/${id}`)
                        .then((res: Response) => {
                            // some logging here please!
                            Log.test("Should have failed: " + res);
                            expect.fail();
                        })
                        .catch((err) => {
                            // some logging here please!
                            Log.test("Should not have failed: " + err);
                            expect(err.status).to.be.equal(400);
                        });
                } catch (err) {
                    // and some more logging here!
                    Log.test("DELETE test error: " + err);
                }
            });
        }
    });

    it("DELETE invalid test cases: id not found", () => {
        const id = "notExistingId";
        try {
            return chai.request(SERVER_URL)
                .del(`/dataset/${id}`)
                .then((res: Response) => {
                    // some logging here please!
                    Log.test("Should have failed: " + res);
                    expect.fail();
                })
                .catch((err) => {
                    // some logging here please!
                    Log.test("Should not have failed: " + err);
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            // and some more logging here!
            Log.test(err);
            Log.test("DELETE test error: " + err);
        }
    });

    it("GET dataset valid test case: empty", () => {
        try {
            return chai.request(SERVER_URL)
                .get(`/datasets`)
                .then((res: Response) => {
                    // some logging here please!
                    Log.test("Should be accepted: " + res);
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).deep.equal([]);
                })
                .catch((err) => {
                    // some logging here please!
                    Log.test("Should not have failed: " + err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.test("DELETE test error: " + err);
        }
    });

    it("GET dataset valid test case: after add valid dataset", () => {
        const id = "courses";
        const kind = InsightDatasetKind.Courses;
        const expected: InsightDataset[] = [{
            id: "courses",
            kind: InsightDatasetKind.Courses,
            numRows: 64612
        }];
        try {
            return chai.request(SERVER_URL)
                .put(`/dataset/${id}/${kind}`)
                .send(dataset[id])
                .set("Content-Type", "application/x-zip-compressed")
                .then(() => {
                    return chai.request(SERVER_URL)
                        .get(`/datasets`)
                        .then((res: Response) => {
                            expect(res.status).to.be.equal(200);
                            expect(res.body.result).deep.equal(expected);
                        });
                })
                .catch((err) => {
                    // some logging here please!
                    Log.test("Should not have failed: " + err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.test("DELETE test error: " + err);
        }
    });

    describe("POST: perform query", () => {
        const validQuery = {
            WHERE: {GT: {courses_avg: 97}},
            OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDER: "courses_avg"}
        };
        const expectedResult = [
            { courses_dept: "epse", courses_avg: 97.09 },
            { courses_dept: "math", courses_avg: 97.09 },
            { courses_dept: "math", courses_avg: 97.09 },
            { courses_dept: "epse", courses_avg: 97.09 },
            { courses_dept: "math", courses_avg: 97.25 },
            { courses_dept: "math", courses_avg: 97.25 },
            { courses_dept: "epse", courses_avg: 97.29 },
            { courses_dept: "epse", courses_avg: 97.29 },
            { courses_dept: "nurs", courses_avg: 97.33 },
            { courses_dept: "nurs", courses_avg: 97.33 },
            { courses_dept: "epse", courses_avg: 97.41 },
            { courses_dept: "epse", courses_avg: 97.41 },
            { courses_dept: "cnps", courses_avg: 97.47 },
            { courses_dept: "cnps", courses_avg: 97.47 },
            { courses_dept: "math", courses_avg: 97.48 },
            { courses_dept: "math", courses_avg: 97.48 },
            { courses_dept: "educ", courses_avg: 97.5 },
            { courses_dept: "nurs", courses_avg: 97.53 },
            { courses_dept: "nurs", courses_avg: 97.53 },
            { courses_dept: "epse", courses_avg: 97.67 },
            { courses_dept: "epse", courses_avg: 97.69 },
            { courses_dept: "epse", courses_avg: 97.78 },
            { courses_dept: "crwr", courses_avg: 98 },
            { courses_dept: "crwr", courses_avg: 98 },
            { courses_dept: "epse", courses_avg: 98.08 },
            { courses_dept: "nurs", courses_avg: 98.21 },
            { courses_dept: "nurs", courses_avg: 98.21 },
            { courses_dept: "epse", courses_avg: 98.36 },
            { courses_dept: "epse", courses_avg: 98.45 },
            { courses_dept: "epse", courses_avg: 98.45 },
            { courses_dept: "nurs", courses_avg: 98.5 },
            { courses_dept: "nurs", courses_avg: 98.5 },
            { courses_dept: "epse", courses_avg: 98.58 },
            { courses_dept: "nurs", courses_avg: 98.58 },
            { courses_dept: "nurs", courses_avg: 98.58 },
            { courses_dept: "epse", courses_avg: 98.58 },
            { courses_dept: "epse", courses_avg: 98.7 },
            { courses_dept: "nurs", courses_avg: 98.71 },
            { courses_dept: "nurs", courses_avg: 98.71 },
            { courses_dept: "eece", courses_avg: 98.75 },
            { courses_dept: "eece", courses_avg: 98.75 },
            { courses_dept: "epse", courses_avg: 98.76 },
            { courses_dept: "epse", courses_avg: 98.76 },
            { courses_dept: "epse", courses_avg: 98.8 },
            { courses_dept: "spph", courses_avg: 98.98 },
            { courses_dept: "spph", courses_avg: 98.98 },
            { courses_dept: "cnps", courses_avg: 99.19 },
            { courses_dept: "math", courses_avg: 99.78 },
            { courses_dept: "math", courses_avg: 99.78 }
        ];
        it("valid query", () => {
            try {
                const id = "courses";
                const kind = InsightDatasetKind.Courses;
                return chai.request(SERVER_URL)
                    .put(`/dataset/${id}/${kind}`)
                    .set("Content-Type", "application/x-zip-compressed")
                    .send(dataset[id])
                    .then(() => {
                        chai.request(SERVER_URL)
                            .post("/query")
                            .send(validQuery)
                            .then((res: Response) => {
                                Log.test("POST request succeeded");
                                expect(res.status).to.be.equal(200);
                                expect(res.body.result).deep.equal(expectedResult);
                            })
                            .catch((err) => {
                                Log.error("POST request failed" + err);
                                Log.error("Should not have failed: " + err);
                                expect.fail();
                            });
                    });
            } catch (err) {
                // and some more logging here!
                Log.test("DELETE test error: " + err);
            }
        });
    });
    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
