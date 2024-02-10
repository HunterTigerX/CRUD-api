import http from 'http';
import path from 'path';
import db from './database.json' with { type: 'json' };

const host = process.env.HOST;
const port = process.env.PORT;
const separator = path.sep;
const errorInvalidData = JSON.stringify({
    message: 'Invalid data in request',
});
const userNotFound = JSON.stringify({
    message: 'User with this ID was not found',
});
const pageNotFound = JSON.stringify({
    message: "Resource that you requested doesn't exist",
});

const requestListener = function (req, res) {
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
        res.writeHead(200);
        res.end(pageNotFound);
    } else if (isValidPath && noArgs && method === 'GET') {
        // GET all users request
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify(db.users));
    } else if (isValidPath && userId && method === 'GET') {
        // GET user request

        const userExists = db.users.find((user) => user.id === Number(userId));

        if (userExists) {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(JSON.stringify(userExists));
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(userNotFound);
        }
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.end(pageNotFound);
    }
};

const server = http.createServer(requestListener);

server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
