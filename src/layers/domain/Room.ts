import Dataset from "./Dataset";
import Building from "./Building";
import GeographicalCoordinate from "./GeographicalCoordinate";

export default class Room extends Dataset {
    public readonly fullname: string;
    public readonly shortname: string;
    public readonly number: string;
    public readonly name: string;
    public readonly address: string;
    public readonly lat: number;
    public readonly lon: number;
    public readonly seats: number;
    public readonly type: string;
    public readonly furniture: string;
    public readonly href: string;
    constructor(
        building: Building,
        coordinate: GeographicalCoordinate,
        iRoom: IRoom
    ) {
        super();
        this.fullname = building.fullName;
        this.shortname = building.shortName;
        this.number = iRoom.roomNumber;
        this.name = this.shortname + "_" + this.number;
        this.address = building.address;
        this.lat = coordinate.lat;
        this.lon = coordinate.lon;
        this.seats = iRoom.seats;
        this.type = iRoom.roomType;
        this.furniture = iRoom.furniture;
        this.href = iRoom.href;
    }

    public isIdentical(otherRoom: Room): boolean {
        return this.name === otherRoom.name;
    }
}

export interface IRoom {
    roomNumber: string;
    seats: number;
    roomType: string;
    furniture: string;
    href: string;
}
