export default class Building {
    public readonly fullName: string;
    public readonly shortName: string;
    public readonly address: string;
    public readonly href: string;
    constructor(
        iBuilding: IBuilding
    ) {
        this.fullName = iBuilding.fullName;
        this.shortName = iBuilding.shortName;
        this.address = iBuilding.address;
        this.href = iBuilding.href;
    }
}

export interface IBuilding {
    fullName: string;
    shortName: string;
    address: string;
    href: string;
}
