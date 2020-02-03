import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export default class Scheduler implements IScheduler {
    private startPt = [49.26372, -123.25099];
    private sortedSec: SchedSection[];
    private startRoom: SchedRoom;
    private result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
    private timeSlots: TimeSlot[] = ["MWF 0800-0900" , "MWF 0900-1000" , "MWF 1000-1100" ,
        "MWF 1100-1200" , "MWF 1200-1300" , "MWF 1300-1400" ,
        "MWF 1400-1500" , "MWF 1500-1600" , "MWF 1600-1700" ,
        "TR  0800-0930" , "TR  0930-1100" , "TR  1100-1230" ,
        "TR  1230-1400" , "TR  1400-1530" , "TR  1530-1700"];

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        // TODO Implement this
        this.sortedSec = this.sortSec(sections);
        this.findFirstSet(rooms);
        this.sortedSec = this.sortedSec.slice(this.sortedSec.indexOf(this.result[0][1]) + 1);
        this.sortedSec.forEach((sec: SchedSection) => {
            this.findCloseFitRoom(rooms, sec);
        });
        return this.result;
    }

    private sortSec(sections: SchedSection[]): SchedSection[] {
        let sortedSec = sections.sort((a, b) => {
            let asum = a["courses_pass"] + a["courses_fail"] + a["courses_audit"];
            let bsum = b["courses_pass"] + b["courses_fail"] + b["courses_audit"];
            return bsum - asum;
        });
        return sortedSec;
    }

    // Find the first set by matching the biggest section that could fit to the biggest room.
    private findFirstSet (rooms: SchedRoom[]) {
        let firstSec = this.sortedSec[0];
        let maxRoom = rooms[0];
        rooms.forEach((room: SchedRoom) => {
            if (room.rooms_seats > maxRoom.rooms_seats) {
                maxRoom = room;
            }
        });
        this.sortedSec.every((sec: SchedSection) => {
            let secSize = sec.courses_audit + sec.courses_fail + sec.courses_pass;
            if (maxRoom.rooms_seats > secSize) {
                this.startRoom = maxRoom;
                this.result.push([maxRoom, firstSec, "MWF 0800-0900"]);
                return false;
            }
        });
    }

    private findCloseFitRoom(rooms: SchedRoom[], section: SchedSection): void {
        let secSize = section.courses_fail + section.courses_audit + section.courses_pass;
        let roomDistList = this.arrangeRoomDist(this.startRoom, rooms);
        roomDistList.every((entry: [SchedRoom, number]) => {
            if (entry[0].rooms_seats >= secSize) {
                let timeSlot = this.findTimeSlot(entry[0], section);
                if (timeSlot) {
                    this.result.push([entry[0], section, timeSlot]);
                    return false;
                }
            }
            return true;
        });
    }

    // This function return an array of all SchedRooms in ascending order based on the distance to the give room.
    private arrangeRoomDist (room: SchedRoom, rooms: SchedRoom[]): Array<[SchedRoom, number]> {
        let roomDist: Array<[SchedRoom, number]> = [];
        rooms.forEach((curRoom) => {
            roomDist.push([curRoom, this.calDist(room, curRoom)]);
        });
        roomDist = roomDist.sort((a, b) => {
            return a[1] - b[1];
        });
        return roomDist;
    }

    // This function will return an available time slot for the specific room.
    // If no slot is found, the function will return undefined.
    private findTimeSlot (room: SchedRoom, section: SchedSection): TimeSlot {
        let availTime: TimeSlot;
        this.timeSlots.every((time: TimeSlot) => {
            if (!this.checkIfSlotTaken(room, time, section)) {
                availTime = time;
                return false;
            }
            return true;
        });
        return availTime;
    }

    // This function checks if the timeslot for the specified room is scheduled
    // Returns true if timeslot is scheduled, false otherwise.
    private checkIfSlotTaken (room: SchedRoom, time: TimeSlot, section: SchedSection): boolean {
        let found = false;
        this.result.forEach((entry) => {
            // same course cannot be schedule in the same time slot
            // only one section can be schedule in one room at one time slot
            if ((this.checkIfSameCourse(entry[1], section) && entry[2] === time)
                || entry[0] === room && entry[2] === time) {
                found = true;
                return;
            }
        });
        return found;
    }

    private checkIfSameCourse (section1: SchedSection, section2: SchedSection): boolean {
        if (section1.courses_id === section2.courses_id && section1.courses_dept === section2.courses_dept) {
            return true;
        }
        return false;
    }

    // This following code is copied from https://www.movable-type.co.uk/scripts/latlong.html
    private calDist(room1: SchedRoom, room2: SchedRoom): number {
        let R = 6371e3;
        let lat1 = this.degreeToRad(room1.rooms_lat);
        let lat2 = this.degreeToRad(room2.rooms_lat);
        let latDiff = this.degreeToRad(room2.rooms_lat - room1.rooms_lat);
        let lonDiff = this.degreeToRad(room2.rooms_lon - room1.rooms_lon);

        let a = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);

        let c =  2  * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    private degreeToRad (degree: number) {
        let pi = Math.PI;
        return degree * (pi / 180);
    }
}
