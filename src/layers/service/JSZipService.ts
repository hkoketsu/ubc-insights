import * as JSZip from "jszip";
import {InsightDatasetKind, InsightError} from "../../controller/IInsightFacade";
import Building from "../domain/Building";

export default class JSZipService {
    public decodeZipData(content: string, datasetKind: InsightDatasetKind): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            this.loadBase64String(content)
                .then((zip) => {
                    return this.convertToDatasetTexts(zip, datasetKind.toString());
                })
                .then((texts) => resolve(texts))
                .catch(() => reject(new InsightError("Could not decode zip file")));
        });
    }

    public getBuildingDetailsText(zip: JSZip, building: Building): Promise<string> {
        return this.convertToBuildingDetailText(zip, building.shortName);
    }

    public loadBase64String(base64String: string): Promise<JSZip> {
        return new Promise<JSZip>((resolve, reject) => {
            JSZip.loadAsync(base64String, { base64: true })
                .then((zip) => resolve(zip))
                .catch((e) => reject(e));
        });
    }

    public getRoomIndexHtml(zip: JSZip): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const indexFile = zip.file("rooms/index.htm");
            if (!indexFile) {
                reject(new InsightError("The content does not have index file"));
            } else {
                indexFile.async("text")
                    .then((text) => resolve(text))
                    .catch((e) => reject(e));
            }
        });
    }

    private convertToBuildingDetailText(zip: JSZip, buildingShortName: string): Promise<string> {
        const pathToRoomInfoFolder = "rooms/campus/discover/buildings-and-classrooms";
        const filePath = `${pathToRoomInfoFolder}/${buildingShortName}`;
        return zip.file(filePath).async("text");
    }

    private convertToDatasetTexts(zip: JSZip, folderName: string): Promise<string[]> {
        const promises: Array<Promise<string>> = [];
        if (!zip.folder(folderName) || zip.folder(folderName).length === 0) {
            return Promise.reject(new InsightError("No dataset found"));
        }
        zip.folder(folderName).forEach((relativePath: string) => {
            promises.push(zip.file(`${folderName}/${relativePath}`).async("text"));
        });
        return Promise.all(promises);
    }
}
