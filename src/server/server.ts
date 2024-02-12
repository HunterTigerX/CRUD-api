import http from 'http';
import cluster from 'cluster';
import os from 'os';
import newUserDB from './newUserDb';
import { requestListener } from './listener';

const args = process.argv.slice(2, 3).toString().split('=')[1];
const port = args === 'single' ? Number(process.env.PORT) : Number(process.env.MULTIPORT);
const host = process.env.HOST;

const numCPUs = os.availableParallelism();
let nextWorkerIndex = 0;
const readyWorkers: any[] = [];

export const newDb = new newUserDB(port);

if (cluster.isPrimary && port === 4000) {
    for (let i = 0; i < numCPUs; i += 1) {
        const worker = cluster.fork();
        worker.on('online', () => {
            readyWorkers.push(worker);
        });

        worker.on('exit', (worker: any, code: any, signal: any) => {
            // console.log(`Worker ${worker.id} died`);

            const workerIndex = readyWorkers.indexOf(worker);
            if (workerIndex !== -1) {
                readyWorkers.splice(workerIndex, 1);
            }
        });
    }
    cluster.on('exit', () => {
        cluster.fork();
    });

    const loadMasterServer = http.createServer(async (req, res) => {

        const parsedUrl = new URL(`http://${host}:${port}${req.url}`);
        const usersPath = parsedUrl.pathname;

        const worker = readyWorkers[nextWorkerIndex];
        nextWorkerIndex = (nextWorkerIndex + 1) % readyWorkers.length;
        const newPort = port + worker.id;

        const options = {
            hostname: 'localhost',
            port: newPort,
            path: usersPath,
            method: req.method,
            headers: req.headers,
        };

        const proxyReq = http.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode as number, proxyRes.headers);
            proxyRes.pipe(res);
        });

        req.pipe(proxyReq);

        proxyReq.on('error', (err) => {
            console.error('Error forwarding request:', err);
            res.statusCode = 500;
            res.end('Internal server error');
        });
    });

    cluster.on('message', (requestMessage: any, worker) => {
        if (worker.type === 'updateDataInDb') {
            for (const id in cluster.workers) {
                cluster.workers[id]?.send(worker.body);
            }
        }
    });

    loadMasterServer.listen(port, () => {
        console.log(`Server is running on http://${host}:${port} and worker ${process.pid} is working`);
    });
} else {
    const server = http.createServer(requestListener);

    if (port === 4000) {
        process.on('message', (newUserData: any) => {
            newDb.updateDb(newUserData);
        });

        if (process && typeof process.send === 'function') {
            const clusterWorker = cluster.worker;

            if (clusterWorker) {
                if (clusterWorker.id !== 1) {
                    server.listen(port + clusterWorker.id - 1, () => {
                        console.log(
                            `Server is running on http://${host}:${port + clusterWorker.id - 1} and worker ${process.pid} is working`
                        );
                    });
                }
            }
        }
    } else {
        server.listen(port, host, () => {
            console.log(`Server is running on http://${host}:${port}`);
        });
    }
}
