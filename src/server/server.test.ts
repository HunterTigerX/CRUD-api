import http from 'http';

const port = 3000;
const host = 'localhost';
const testUserId = ''; // Paste newly created user UUID here or UID from database copy if you copied database.
const expectedUser = {
    id: expect.any(String),
    username: expect.any(String),
    age: expect.any(Number),
    hobbies: expect.arrayContaining([expect.any(String)]),
};

describe('doStuffByTimeout', () => {

  test('GET all users', (done) => {
        http.get(`http://${host}:${port}/api/users`, (res) => {
            expect(res.statusCode).toBe(200);

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const usersWeReceived = JSON.parse(data);
                if (data === '[]') {
                    expect(usersWeReceived).toEqual([]);
                } else {
                    expect(usersWeReceived).toEqual(expect.arrayContaining([expectedUser]));
                }
                done();
            });
        });
    });

    test('GET created user', (done) => {
        http.get(`http://${host}:${port}/api/users/${testUserId}`, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const user = JSON.parse(data);
                if (user === '') {
                    expect(res.statusCode).toBe(404);
                    expect(user).toBe('');
                } else {
                    expect(user).toEqual(expect.objectContaining(expectedUser));
                    expect(res.statusCode).toBe(200);
                }
                done();
            });
        });
    });

    test('DELETE created user', (done) => {
        http.get(`http://${host}:${port}/api/users/${testUserId}`, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const user = JSON.parse(data);
                if (user === '') {
                    expect(res.statusCode).toBe(404);
                    expect(user).toBe('');
                } else {
                    const options = {
                        hostname: 'localhost',
                        port: 3000,
                        path: `/api/users/${testUserId}`,
                        method: 'DELETE',
                    };

                    const req = http.request(options, (res) => {
                        expect(res.statusCode).toBe(204);
                        done();
                    });
                    req.end();
                }
                done();
            });
        });
    });
});
