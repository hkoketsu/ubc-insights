import Building, {IBuilding} from "../domain/Building";
import Room, {IRoom} from "../domain/Room";
import GeographicalCoordinate from "../domain/GeographicalCoordinate";

export default class DocumentService {
    public getBuildings(indexDocument: Document): Building[] {
        const tables = this.getElementsByTagName(indexDocument.childNodes, "table");
        let tableRowElements: ChildNode[] = null;
        tables.forEach((table) => {
            if (!tableRowElements) {
                tableRowElements = this.getElementsByTagName(table.childNodes, "tr");
            }
        });
        if (!tableRowElements) {
            return [];
        }
        const buildings: Building[] = [];
        tableRowElements.forEach((tr) => {
            const tdList = this.getElementsByTagName(tr.childNodes, "td");
            if (tdList.length !== 0) {
                const iBuilding: IBuilding = {address: "", fullName: "", href: "", shortName: ""};
                tdList.forEach((td: any) => {
                    const className = this.getAttrValue(td, "class");
                    const dataValue = this.getTextValue(td);
                    if (className && dataValue) {
                        switch (className) {
                            case "views-field views-field-field-building-code":
                                iBuilding.shortName = dataValue;
                                break;
                            case "views-field views-field-title":
                                iBuilding.fullName = dataValue;
                                break;
                            case "views-field views-field-field-building-address":
                                iBuilding.address = dataValue;
                                break;
                            case "views-field views-field-nothing":
                                const uri = this.getAttrValue(td, "href");
                                iBuilding.href = uri.replace("./", "http://students.ubc.ca/");
                                break;
                        }
                    }
                });
                buildings.push(new Building(iBuilding));
            }
        });
        return buildings;
    }

    public getRooms(buildingDetailDocument: Document, building: Building, coordinate: GeographicalCoordinate): Room[] {
        const table = this.getElementsByTagName(buildingDetailDocument.childNodes, "table")[0];
        if (!table) {
            return [];
        }
        const rooms: Room[] = [];
        const tableRowElements = this.getElementsByTagName(table.childNodes, "tr");
        tableRowElements.forEach((tr) => {
            const tdList = this.getElementsByTagName(tr.childNodes, "td");
            if (tdList.length !== 0) {
                const iRoom: IRoom = {furniture: "", roomNumber: "", roomType: "", seats: 0, href: ""};
                tdList.forEach((td: any) => {
                    const className = this.getAttrValue(td, "class");
                    const dataValue = this.getTextValue(td);
                    if (className && dataValue) {
                        switch (className) {
                            case "views-field views-field-field-room-number":
                                iRoom.roomNumber = dataValue;
                                iRoom.href = this.getAttrValue(td, "href");
                                break;
                            case "views-field views-field-field-room-capacity":
                                iRoom.seats = +dataValue;
                                break;
                            case "views-field views-field-field-room-furniture":
                                iRoom.furniture = dataValue;
                                break;
                            case "views-field views-field-field-room-type":
                                iRoom.roomType = dataValue;
                                break;
                        }
                    }
                });
                rooms.push(new Room(building, coordinate, iRoom));
            }
        });
        return rooms;
    }

    private getElementsByTagName(childNodes: NodeListOf<ChildNode>, tagName: string): ChildNode[] {
        let founds: ChildNode[] = [];
        childNodes.forEach((childNode) => {
            if (childNode.nodeName === tagName) {
                founds.push(childNode);
            } else if (childNode.childNodes !== undefined) {
                const results = this.getElementsByTagName(childNode.childNodes, tagName);
                if (results.length !== 0) {
                    founds = [].concat(founds, results);
                }
            }
        });
        return founds;
    }

    private getAttrValue(node: any, attrName: string): string {
        if (node.attrs) {
            for (const attr of node.attrs) {
                if (attr.name === attrName) {
                    return attr.value;
                }
            }
        }
        if (node.childNodes) {
            for (const childNode of node.childNodes) {
                const result = this.getAttrValue(childNode, attrName);
                if (result) {
                    return result;
                }
            }
        } else {
            return null;
        }
    }

    private getTextValue(node: any): string {
        if (node.nodeName && node.nodeName === "#text" && node.value) {
            const text = this.trim(node.value);
            if (text && text !== "") {
                return text;
            }
        }
        if (node.childNodes) {
            for (const childNode of node.childNodes) {
                const result = this.getTextValue(childNode);
                if (result) {
                    return result;
                }
            }
        } else {
            return null;
        }
    }

    private trim(value: string): string {
        return value.replace(/(\r\n|\n|\r)/gm, "").trim();
    }
}

