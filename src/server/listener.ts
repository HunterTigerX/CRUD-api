import { generateUUID, isUUID } from './uuid';
import { IUserList, IUserBodyFull, IUserBody } from './interfaces';
import { newDb } from './server';

// const db = database as IUserList;
const args = process.argv.slice(2, 3).toString().split('=')[1];
const port = args === 'single' ? Number(process.env.PORT) : Number(process.env.MULTIPORT);
const host = process.env.HOST;

const separator = '/';

const errorInvalidIdFormat = JSON.stringify({
    message: 'Invalid userId (not in uuid format)',
});
const errorInvalidData = JSON.stringify({
    message:
        "Invalid data in request. Probably you are missing required fields or using invalid data type for object key's value or have extra fields",
});
const errorBadBody = JSON.stringify({
    message: 'Your body might contain errors and cannot be converted to JSON',
});
const errorInvalidBody = JSON.stringify({
    message: 'Request body does not contain required fields or have extra fields',
});
const userIdNotProvided = JSON.stringify({
    message: 'Your url does not contain user ID, so user id is invalid',
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
    message:
        "Resource that you requested doesn't exist or you are posting to a wrong path. You should post to localhost:3000/api/users/",
});
const pageNotFoundDelete = JSON.stringify({
    message:
        "Resource that you requested doesn't exist or you are posting to a wrong path. You should post to 'localhost:3000/api/users/id' where id is UUID",
});

export const requestListener = async function (req: any, res: any) {
    let data = '';

    await new Promise((resolve, reject) => {
        req.on('data', (chunk: string) => {
            data += chunk;
        });

        req.on('end', () => {
            resolve('success');
        });
    });

    async function validateRawInput(stringedBody: string) {
        // Checking if User provided body that can be parsed to JSON
        try {
            JSON.parse(stringedBody);
            return Promise.resolve(JSON.parse(stringedBody));
        } catch (err) {
            return Promise.resolve('Invalid body');
        }
    }
    async function validateRawBody(obj: object) {
        // Checking if provided body has all keys
        const userDbKeys = ['username', 'age', 'hobbies'];
        const rawKeys = Object.keys(obj);
        return Promise.resolve(
            rawKeys.length === userDbKeys.length && rawKeys.every((key) => userDbKeys.includes(key))
        );
    }
    async function validateDataType(obj: IUserBody) {
        let username = obj.username;
        let age = obj.age;
        let hobbies = obj.hobbies;

        if (typeof age === 'string') {
            age = age.trim();
        }
        if (typeof username === 'string') {
            username = username.trim();
        }

        let isUsernameCorrect =
            typeof username === 'string' &&
            // && isNaN(username)
            username.length !== 0;
        let isUserAgeCorrect = !isNaN(Number(age)) && age !== null && age.toString.length !== 0;
        let isUserHobbiesCorrect =
            Array.isArray(hobbies) && (hobbies.every((item) => typeof item === 'string') || hobbies.length === 0);

        return Promise.resolve(isUsernameCorrect && isUserAgeCorrect && isUserHobbiesCorrect);
    }

    const method = req.method;

    const parsedUrlX = new URL(`http://${host}:${port}${req.url}`);
    const requestedUrl = parsedUrlX.pathname;

    const urlArguments = requestedUrl.split(separator).filter(Boolean); // this is our url arguments
    let userId = urlArguments.length >= 3 ? urlArguments[2] : undefined;
    let isValidPath = urlArguments[0] === 'api' && urlArguments[1] === 'users'; // we check if path is valid
    const noArgs = urlArguments.length === 2; // We check if there were any arguments
    const tooManyArgs = urlArguments.length > 3; // We check if there were any arguments

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
            res.end(JSON.stringify(newDb.getUsers()));
        } else if (isValidPath && userId) {
            // GET user request
            if (await isUUID(userId)) {
                // UID has UUID format
                const userExists = newDb.getUsers().find((user) => user.id === userId);

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
                    res.writeHead(400);
                    res.end(errorInvalidData);
                } else {
                    // User data had correct data types
                    let newUsersId = await generateUUID();
                    const userExists = newDb.getUsers().find((user) => user.id === userId);
                    while (userExists) {
                        newUsersId = await generateUUID();
                    }
                    newUserData.age = Number(newUserData.age); // If user provided number, but in string format, we convert it to number
                    const fullNewUser = Object.assign(newUsersId, newUserData) as IUserBodyFull;
                    newDb.addNewUser(fullNewUser);
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
                const userExists = newDb.getUsers().find((user) => user.id === userId);
                // const userExists = db.users.find((user) => user.id === userId);

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
                            res.writeHead(400);
                            res.end(errorInvalidData);
                        } else {
                            const existingId = {
                                id: userExists.id,
                            };
                            const editedUser = Object.assign(existingId, newUserData);
                            newDb.modifyUser(userId, editedUser)
                            
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
                const userExists = newDb.getUsers().find((user) => user.id === userId);
                // const userExists = db.users.find((user) => user.id === userId);

                if (userExists) {
                    // provided user with specified UUID exists
                    newDb.deleteUser(userId);
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
            res.end(pageNotFoundDelete);
        }
    } else {
        // request is not POST or GET or PUT
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(404);
        res.end(pageNotFound);
    }
};
