import http from 'http';
import path from 'path';
import db from './database.json' with { type: 'json' };
import { generateUUID, isUUID } from './uuid.mjs';

const host = process.env.HOST;
const port = process.env.PORT;
const separator = path.sep;
const errorInvalidId = JSON.stringify({
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
        const checks = ['string', true, 'array'];
        const rawKeys = Object.keys(obj);
        return Promise.resolve(
            rawKeys.length === userDbKeys.length && rawKeys.every((key) => userDbKeys.includes(key))
        );
    }
    async function validateDataType(obj) {
        return Promise.resolve(
            typeof obj.username === 'string' &&
                isNaN(obj.username) === true && // if Username is not a number or falsy
                !isNaN(obj.age) === true &&
                Array.isArray(obj.hobbies)
        );
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
                res.end(errorInvalidId);
            }
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(400);
            res.end(pageNotFound);
        }
    } else if (method === 'POST') {
        if (isValidPath && noArgs) {
            // POST request url was correct
            const newUserData = await validateRawInput(data); // We check if data can be parsed to object

            if (newUserData === 'Invalid body') {
                // User data structure was invalid
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(400);
                res.end(errorBadBody);
            } else if ((await validateDataType(newUserData)) === false) {
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(400);
                res.end(errorInvalidData);
            } else if (await validateRawBody(newUserData)) {
                // User data was correct and had correct data types

                let newUsersId = await generateUUID();
                const userExists = db.users.find((user) => user.id === newUsersId);
                while (userExists) {
                    newUsersId = await generateUUID();
                }

                const fullNewUser = Object.assign(newUsersId, newUserData);
                db.users.push(fullNewUser);
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(201);
                res.end(JSON.stringify(fullNewUser));
            } else {
                // User data was invalid
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(400);
                res.end(errorInvalidBody);
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
                    // provided UUID exists

                    const newUserData = await validateRawInput(data); // We check if data can be parsed to object

                    if (newUserData === 'Invalid body') {
                        // New user data structure was invalid
                        res.setHeader('Content-Type', 'application/json');
                        res.writeHead(400);
                        res.end(errorBadBody);
                    } else if ((await validateDataType(newUserData)) === false) {
                        // New user data has invalid format
                        res.setHeader('Content-Type', 'application/json');
                        res.writeHead(400);
                        res.end(errorInvalidData);
                    } else if (await validateRawBody(newUserData)) {
                        // Provided new user body was correct
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
                res.end(errorInvalidId);
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
        res.end(pageNotFound);
    }
};

const server = http.createServer(requestListener);

server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
