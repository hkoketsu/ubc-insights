export default class GeographicalCoordinate {
    public readonly lat: number;
    public readonly lon: number;
    constructor(lat: number, lon: number) {
        this.lat = lat;
        this.lon = lon;
    }
}
