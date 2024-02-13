import { IUserBodyFull } from './interfaces';
import cluster from "cluster";
const clusterWorker = cluster.worker;

export default class newUserDB {
    _users: Array<IUserBodyFull> = [];
    _multicore: number = 0;

    constructor(port: number) {
        this._users = [];
        this._multicore = port === 4000 ? 1 : 0;
    }

    addNewUser(user: IUserBodyFull) {
        this._users.push(user);
        if (this._multicore === 1 && clusterWorker) {
            clusterWorker.send({ type: "updateDataInDb", body: this._users });
        }
    }

    getUsers() {
        return this._users;
    }

    modifyUser(userId: any, newUserData: any) {
        this._users.map((user, index) => {
            if (user.id === userId) {
                this._users[index] = newUserData;
            }
        });
        if (this._multicore === 1 && clusterWorker) {
            clusterWorker.send({ type: "updateDataInDb", body: this._users });
        }
    }
    deleteUser(userId: any) {
        this._users.map((user, index) => {
            if (user.id === userId) {
                this._users.splice(index, 1);
            }
        });
        if (this._multicore === 1 && clusterWorker) {
            clusterWorker.send({ type: "updateDataInDb", body: this._users });
        }
    }
    updateDb(newDb: Array<IUserBodyFull>) {
        this._users = newDb;
    }
}
