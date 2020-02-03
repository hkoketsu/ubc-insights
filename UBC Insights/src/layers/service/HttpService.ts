import GeographicalCoordinate from "../domain/GeographicalCoordinate";
import {IncorrectAddressError} from "../domain/Error/IncorrectAddressError";

export default class HttpService {
    public getGeographicalCoordinate(address: string): Promise<GeographicalCoordinate> {
        return new Promise((resolve, reject) => {
            const http = require("http");
            const host = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team208";
            const uri = `${host}/${encodeURI(address)}`;
            http.get(uri, (res: any) => {
                if (res.statusCode !== 200) {
                     reject(new IncorrectAddressError(`Request to get geographical coordinate failed with: ${res}`));
                }
                const data: number[] = [];
                res.on("data", (chunk: number) => {
                    data.push(chunk);
                });
                res.on("end", () => {
                    const json = JSON.parse(data.join(""));
                    const coordinate = new GeographicalCoordinate(json.lat, json.lon);
                    resolve(coordinate);
                });
            });
        });
    }
}
