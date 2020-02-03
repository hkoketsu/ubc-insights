import {InsightDatasetKind, InsightError} from "../../../controller/IInsightFacade";
import JSZipService from "../JSZipService";
import DatasetService from "./DatasetService";
import Room from "../../domain/Room";
import HtmlService from "../HtmlService";
import DocumentService from "../DocumentService";
import Building from "../../domain/Building";
import * as JSZip from "jszip";
import HttpService from "../HttpService";
import Dataset from "../../domain/Dataset";
import {IncorrectAddressError} from "../../domain/Error/IncorrectAddressError";

export default class RoomDatasetService extends DatasetService {
    private jszipService: JSZipService;
    private htmlService: HtmlService;
    private httpService: HttpService;
    private documentService: DocumentService;
    constructor() {
        super();
        this.jszipService = new JSZipService();
        this.htmlService = new HtmlService();
        this.httpService = new HttpService();
        this.documentService = new DocumentService();
    }

    public load(id: string, content: string, kind: InsightDatasetKind): Promise<Dataset[]> {
        return new Promise<Dataset[]>((resolve, reject) => {
            if (kind !== InsightDatasetKind.Rooms) {
                reject(new InsightError(`The dataset kind should be rooms but is ${kind}`));
            }
            this.jszipService
                .loadBase64String(content)
                .then((zip) => {
                    return this.jszipService.getRoomIndexHtml(zip)
                        .then((indexHtmlText) => {
                            const buildings = this.getBuildingsFromIndexFile(indexHtmlText);
                            return this.convertBuildingToRooms(buildings, zip);
                        });
                })
                .then((roomsData) => {
                    this.createJsonFile(id, roomsData, kind)
                        .then(() => resolve(roomsData));
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }

    private getBuildingsFromIndexFile(indexFileText: string): Building[] {
        const indexDocument = this.htmlService.parse(indexFileText);
        return this.documentService.getBuildings(indexDocument);
    }

    private convertBuildingToRooms(buildings: Building[], zip: JSZip): Promise<Room[]> {
        return new Promise<Room[]>((resolve, reject) => {
            const promises: Array<Promise<Room[]>> = [];
            buildings.forEach((building) => {
                const promise = new Promise<Room[]>((innerResolve, innerReject) => {
                    this.httpService.getGeographicalCoordinate(building.address)
                        .then((coordinate) => {
                            this.jszipService.getBuildingDetailsText(zip, building)
                                .then((buildingDetailText) => {
                                    const htmlText = this.htmlService.parse(buildingDetailText);
                                    innerResolve(this.documentService.getRooms(htmlText, building, coordinate));
                                });
                        })
                        .catch((e) => {
                            if (e instanceof IncorrectAddressError) {
                                innerResolve([]);
                            } else {
                                innerReject(e);
                            }
                        });
                });
                promises.push(promise);
            });
            Promise.all(promises)
                .then((rooms) => resolve([].concat(...rooms)))
                .catch((e) => reject(e));
        });
    }
}
