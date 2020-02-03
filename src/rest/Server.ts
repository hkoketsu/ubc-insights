/**
 * Created by rtholmes on 2016-06-19.
 */

import fs = require("fs");
import restify = require("restify");
import Log from "../Util";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";

/**
 * This configures the REST endpoints for the server.
 */
export default class Server {

    private port: number;
    private rest: restify.Server;
    private static insightFacade = new InsightFacade();

    constructor(port: number) {
        Log.info("Server::<init>( " + port + " )");
        this.port = port;
    }

    /**
     * Stops the server. Again returns a promise so we know when the connections have
     * actually been fully closed and the port has been released.
     *
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        Log.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }

    /**
     * Starts the server. Returns a promise with a boolean value. Promises are used
     * here because starting the server takes some time and we want to know when it
     * is done (and if it worked).
     *
     * @returns {Promise<boolean>}
     */
    public start(): Promise<boolean> {
        Log.info("Server::start() - start");
        // return this.loadInitialDataset().then(() => { // this is needed for UI test
        const that = this;
        return new Promise(function (fulfill, reject) {
            try {
                that.rest = restify.createServer({
                    name: "insightUBC",
                });
                that.rest.use(restify.bodyParser({mapFiles: true, mapParams: true}));
                that.rest.use(
                    function crossOrigin(req, res, next) {
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Headers", "X-Requested-With");
                        return next();
                    });

                that.rest.get("/echo/:msg", Server.echo);
                that.rest.get("/datasets", Server.listDataset);
                that.rest.put("/dataset/:id/:kind", Server.putDataset);
                that.rest.del("/dataset/:id", Server.deleteDataset);
                that.rest.post("/cache", Server.deleteCache);
                that.rest.post("/query", Server.postQuery);
                that.rest.get("/.*", Server.getStatic);

                that.rest.listen(that.port, function () {
                    Log.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });

                that.rest.on("error", function (err: string) {
                    // catches errors in restify start; unusual syntax due to internal
                    // node not using normal exceptions here
                    Log.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });
            } catch (err) {
                Log.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
        // });
    }

    private static async putDataset(req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> {
        Log.trace("Server::putDataset(..) - params: " + JSON.stringify(req.params));
        try {
            const response = await Server.insightFacade.addDataset(req.params.id, req.body, req.params.kind);
            Log.info("Server::putDataset(..) - responding " + 200);
            res.json(200, {result: response});
        } catch (e) {
            Log.error("Server::putDataset(..) - responding 400");
            res.json(400, {error: e.message});
        }
        return next();
    }

    private static async deleteDataset(req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> {
        Log.trace("Server::deleteDataset(..) - params: " + JSON.stringify(req.params));
        try {
            const response = await Server.insightFacade.removeDataset(req.params.id);
            Log.trace("Server::deleteDataset(..) - responding " + 200);
            res.json(200, {result: response});
        } catch (e) {
            if (e instanceof InsightError) {
                Log.error("Server::deleteDataset(..) - responding 400");
                res.json(400, {error: e.message});
            } else {
                Log.error("Server::deleteDataset(..) - responding 404");
                res.json(404, {error: e.message});
            }
        }
        return next();
    }

    private static deleteCache(req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> {
        try {
            const fsx = require("fs-extra");
            const cacheDir = __dirname + "/../../data";
            fsx.removeSync(cacheDir);
            fsx.mkdirSync(cacheDir);
            Server.insightFacade = new InsightFacade();
            Log.trace("Server::deleteCache(..) - responding " + 200);
            res.json(200, {result: true});
        } catch (e) {
            Log.error("Server::deleteCache(..) - responding 400");
            res.json(400, {error: e.message});
        }
        return next();
    }

    private static async postQuery(req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> {
        Log.trace("Server::postQuery(..) - body: " + JSON.stringify(req.body));
        try {
            const query = req.body;
            const response = await Server.insightFacade.performQuery(query);
            Log.trace("Server::postQuery(..) - responding " + 200);
            res.json(200, {result: response});
        } catch (e) {
            Log.error("Server::postQuery(..) - responding 400");
            res.json(400, {error: e.message});
        }
        return next();
    }

    private static async listDataset(req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> {
        try {
            const response = await Server.insightFacade.listDatasets();
            Log.info("Server::listDataset(..) - responding " + 200);
            res.json(200, {result: response});
        } catch (e) {
            Log.error("Server::listDataset(..) - responding 400");
            res.json(400, {error: e.message});
        }
        return next();
    }

    // The next two methods handle the echo service.
    // These are almost certainly not the best place to put these, but are here for your reference.
    // By updating the Server.echo function pointer above, these methods can be easily moved.
    private static echo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const response = Server.performEcho(req.params.msg);
            Log.info("Server::echo(..) - responding " + 200);
            res.json(200, {result: response});
        } catch (err) {
            Log.error("Server::echo(..) - responding 400");
            res.json(400, {error: err});
        }
        return next();
    }

    private static performEcho(msg: string): string {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        } else {
            return "Message not provided";
        }
    }

    private static getStatic(req: restify.Request, res: restify.Response, next: restify.Next) {
        const publicDir = "frontend/public/";
        Log.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

    private loadInitialDataset() {
        const promises: Array<Promise<string[]>> = [];
        const datasetToLoad = [
            {id: "courses", path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
            {id: "rooms", path: "./test/data/rooms.zip", kind: InsightDatasetKind.Rooms}
        ];
        for (const dataset of datasetToLoad) {
            const datasetContent = fs.readFileSync(dataset.path).toString("base64");
            promises.push(Server.insightFacade.addDataset(dataset.id, datasetContent, dataset.kind));
        }
        return Promise.all(promises);
    }
}
