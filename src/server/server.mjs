import http from 'http';
import path from 'path';
import cluster from 'cluster';
import os from 'os';
import db from './database.json' with { type: 'json' };
import { generateUUID, isUUID } from './uuid.mjs';

import url from 'url';
import fs from 'fs';

const args = process.argv.slice(2, 3).toString().split('=')[1];
const port = args === 'single' ? Number(process.env.PORT) : Number(process.env.MULTIPORT);
const host = process.env.HOST;

const numCPUs = os.availableParallelism();
const separator = path.sep;
let nextWorkerIndex = 0;
const readyWorkers = [];

const errorInvalidIdFormat = JSON.stringify({
    message: 'Invalid userId (not in uuid format)',
});
const errorInvalidData = JSON.stringify({
    message: "Invalid data in request. Probably you are using invalid data type for object key's value",
});
const errorBadBody = JSON.stringify({
    message: 'Your body might contain errors and cannot be converted to JSON',
});
const errorInvalidBody = JSON.stringify({
    message: 'Request body does not contain required fields or have extra fields',
});
const userIdNotProvided = JSON.stringify({
    message: 'Your url does not contain user ID',
});
const userNotFound = JSON.stringify({
    message: 'User with this ID was not found',
});
const pageNotFound = JSON.stringify({
    message: "Resource that you requested doesn't exist",
});
const errorMissingFieldsBody = JSON.stringify({
    message: 'Your body is missing required fields',
});
const pageNotFoundPost = JSON.stringify({
    message: "Resource that you requested doesn't exist. You should post to localhost:3000/api/users/",
});

const requestListener = async function (req, res) {
    let data = '';

    await new Promise((resolve, reject) => {
        req.on('data', (chunk) => {
            data += chunk;
        });

        req.on('end', () => {
            resolve();
        });
    });

    async function validateRawInput(stringedBody) {
        // Checking if User provided body that can be parsed to JSON
        try {
            JSON.parse(stringedBody);
            return Promise.resolve(JSON.parse(stringedBody));
        } catch (err) {
            return Promise.resolve('Invalid body');
        }
    }
    async function validateRawBody(obj) {
        // Checking if provided body has all keys
        const userDbKeys = ['username', 'age', 'hobbies'];
        const rawKeys = Object.keys(obj);
        return Promise.resolve(
            rawKeys.length === userDbKeys.length && rawKeys.every((key) => userDbKeys.includes(key))
        );
    }
    async function validateDataType(obj) {
        let username = obj.username;
        let age = obj.age;
        let hobbies = obj.hobbies;

        if (typeof age === 'string') {
            age = age.trim();
        }
        if (typeof username === 'string') {
            username = username.trim();
        }

        let isUsernameCorrect = typeof username === 'string' && isNaN(username) && username.length !== 0;
        let isUserAgeCorrect = !isNaN(age) && age !== null && age.length !== 0;
        let isUserHobbiesCorrect =
            Array.isArray(hobbies) && (hobbies.every((item) => typeof item === 'string') || hobbies.length === 0);

        return Promise.resolve(isUsernameCorrect && isUserAgeCorrect && isUserHobbiesCorrect);
    }

    const method = req.method;
    const requestedUrl = path.normalize(req.url); // we transform separators to a standart
    const urlArguments = requestedUrl.split(separator); // this is our url arguments
    if (urlArguments[urlArguments.length - 1] === '') {
        urlArguments.pop();
    }
    let userId = urlArguments.length >= 4 ? urlArguments[3] : undefined;
    let isValidPath = urlArguments[1] === 'api' && urlArguments[2] === 'users'; // we check if path is valid
    const noArgs = urlArguments.length === 3; // We check if there were any arguments
    const tooManyArgs = urlArguments.length > 4; // We check if there were any arguments

    if (tooManyArgs) {
        // If path have too many arguments
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(404);
        res.end(pageNotFound);
    } else if (method === 'GET') {
        if (isValidPath && noArgs) {
            // GET all users request
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(JSON.stringify(db.users));
        } else if (isValidPath && userId) {
            // GET user request
            if (await isUUID(userId)) {
                // UID has UUID format

                const userExists = db.users.find((user) => user.id === userId);

                if (userExists) {
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(200);
                    res.end(JSON.stringify(userExists));
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(404);
                    res.end(userNotFound);
                }
            } else {
                // UID has wrong format
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(400);
                res.end(errorInvalidIdFormat);
            }
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(404);
            res.end(pageNotFound);
        }
    } else if (method === 'POST') {
        if (isValidPath && noArgs) {
            // POST request url was correct
            const newUserData = await validateRawInput(data); // We check if data can be parsed to object

            if (newUserData === 'Invalid body') {
                // User data structure was invalid
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(500);
                res.end(errorBadBody);
            } else if (await validateRawBody(newUserData)) {
                // User data was correct
                if ((await validateDataType(newUserData)) === false) {
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(500);
                    res.end(errorInvalidData);
                } else {
                    // User data had correct data types
                    let newUsersId = await generateUUID();
                    const userExists = db.users.find((user) => user.id === newUsersId);
                    while (userExists) {
                        newUsersId = await generateUUID();
                    }
                    newUserData.age = Number(newUserData.age); // If user provided number, but in string format, we convert it to number
                    const fullNewUser = Object.assign(newUsersId, newUserData);
                    db.users.push(fullNewUser);
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(201);
                    res.end(JSON.stringify(fullNewUser));
                }
            } else {
                // User data was invalid
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(400);
                res.end(errorMissingFieldsBody);
            }
        } else {
            // POST request url was invalid
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(404);
            res.end(pageNotFoundPost);
        }
    } else if (method === 'PUT') {
        if (isValidPath && noArgs) {
            // No userId was provided
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(400);
            res.end(userIdNotProvided);
        } else if (isValidPath && userId) {
            // userId was provided
            if (await isUUID(userId)) {
                // UID has UUID format

                const userExists = db.users.find((user) => user.id === userId);

                if (userExists) {
                    // provided user with specified UUID exists

                    const newUserData = await validateRawInput(data); // We check if data can be parsed to object

                    if (newUserData === 'Invalid body') {
                        // New user data structure was invalid
                        res.setHeader('Content-Type', 'application/json');
                        res.writeHead(500);
                        res.end(errorBadBody);
                    } else if (await validateRawBody(newUserData)) {
                        // Provided new user body was correct

                        if ((await validateDataType(newUserData)) === false) {
                            // New user data has invalid format
                            res.setHeader('Content-Type', 'application/json');
                            res.writeHead(500);
                            res.end(errorInvalidData);
                        } else {
                            const existingId = {
                                id: userExists.id,
                            };
                            const editedUser = Object.assign(existingId, newUserData);
                            db.users.map((user, index) => {
                                if (user.id === userId) {
                                    db.users[index] = editedUser;
                                }
                            });
                            res.setHeader('Content-Type', 'application/json');
                            res.writeHead(200);
                            res.end(JSON.stringify(editedUser));
                        }
                    } else {
                        // User data was invalid
                        res.setHeader('Content-Type', 'application/json');
                        res.writeHead(400);
                        res.end(errorInvalidBody);
                    }
                } else {
                    // provided UUID do not exist
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(404);
                    res.end(userNotFound);
                }
            } else {
                // UID is not in UUID format
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(400);
                res.end(errorInvalidIdFormat);
            }
        } else {
            // invalid path
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(404);
            res.end(pageNotFoundPost);
        }
    } else if (method === 'DELETE') {
        if (isValidPath && noArgs) {
            // No userId was provided
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(400);
            res.end(userIdNotProvided);
        } else if (isValidPath && userId) {
            // userId was provided
            if (await isUUID(userId)) {
                // UID has UUID format

                const userExists = db.users.find((user) => user.id === userId);

                if (userExists) {
                    // provided user with specified UUID exists

                    db.users.map((user, index) => {
                        if (user.id === userId) {
                            db.users.splice(index, 1);
                        }
                    });
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(204);
                    res.end();
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(404);
                    res.end(userNotFound);
                }
            } else {
                // UID is not in UUID format
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(400);
                res.end(errorInvalidIdFormat);
            }
        } else {
            // invalid path
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(404);
            res.end(pageNotFoundPost);
        }
    } else {
        // request is not POST or GET or PUT
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(404);
        res.end(pageNotFound);
    }
};

if (cluster.isPrimary && port === 4000) {
    for (let i = 0; i < numCPUs; i += 1) {
        const worker = cluster.fork();
        worker.on('online', () => {
            // console.log(`Worker ${worker.id}, is online`);
            readyWorkers.push(worker); // Add worker to list after it's online
        });

        worker.on('exit', (worker, code, signal) => {
            // console.log(`Worker ${worker.id} died`);

            const workerIndex = readyWorkers.indexOf(worker);
            if (workerIndex !== -1) {
                readyWorkers.splice(workerIndex, 1);
            }
        });
    }

    const loadMasterServer = http.createServer(requestListener);
    loadMasterServer.on('request', (req, res) => {
        const parsedUrl = new URL(`http://${host}:${port}${req.url}`);
        const usersPath = parsedUrl.pathname;

        const worker = readyWorkers[nextWorkerIndex];

        nextWorkerIndex = (nextWorkerIndex + 1) % readyWorkers.length;

        const newPort = port + worker.id;
        const options = {
            hostname: 'localhost',
            port: newPort - 1,
            path: usersPath,
            method: req.method,
            headers: req.headers,
        };

        const proxyReq = http.request(options, (proxyRes) => {
            // res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        req.pipe(proxyReq);
    });

    loadMasterServer.listen(port, () => {
        console.log(`Server is running on http://${host}:${port} and worker ${process.pid} is working`);
    });
} else {
    const server = http.createServer(requestListener);

    if (port === 4000) {
        process.on('message', (msg) => {
            if (msg.type === 'request') {
                msg.req.pipe(msg.res);
            }
        });

        process.send({ type: 'ready' });

        if (cluster.worker.id !== 1) {
            server.listen(port + cluster.worker.id - 1, () => {
                console.log(
                    `Server is running on http://${host}:${port + cluster.worker.id - 1} and worker ${process.pid} is working`
                );
            });
        }

        process.send({ type: 'ready' });

        const readyWorkers = [];

        cluster.on('message', (msg, worker) => {
            if (msg.type === 'ready') {
                readyWorkers.push(worker);
                if (readyWorkers.length === numCPUs - 1) {
                    startRoundRobin();
                }
            }
        });

        function startRoundRobin() {
            // setInterval(() => {
            const worker = readyWorkers[nextWorkerIndex];
            nextWorkerIndex = (nextWorkerIndex + 1) % readyWorkers.length;
            worker.send('request');
            // }, 1);
        }
    } else {
        server.listen(port, host, () => {
            console.log(`Server is running on http://${host}:${port}`);
        });
    }
}
