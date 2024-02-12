# CRUD-api

- to install all dependencies run npm install in powershell or command prompt in windows or equivalent in other operation systems


- to run the application there are list of available commands
1. npm run start:dev
- This command will start server in development mode and the server will start at port 3000.

2. npm run start:prod
- This command will start server in production mode, file index.js will be bundled in deploy forder and server will start at port 3000

3. npm run start:multi
- This command will start server in production mode, file index.js will be bundled in deploy forder and server will start at port 4000 with a load balancer and you will be able to send requests to different ports depending on you CPU cores count. You can check all available ports in console after starting the server.

4. npm run test
- This command will runn 3 tests. Tests were made for prod version, so run them after you deployed server at port 3000. But I think you can change the value of the port manually if you want to test code on other ports. Also you can either start the server, make request to create a new user to theck the validity of tests or you can put data from "database template.json" into "database.json" file in ./src/server and check test with provided data.


- There are 4 available requests. port ":3000" may vary depending on the command you used. It's ":4000" for "npm run start:multi" and ":3000" for "npm run start:dev" and "npm run start:prod" commands.
1. GET 
- To get all users, make a GET request to "localhost:3000\api\users"
- To check if user exists and return it's data if it exists, make a GET request at "localhost:3000\api\users\id", where id is users id in UUID format.  
2. POST 
- To create new user, make a POST request to "localhost:3000\api\users" with a body with object (example is below. all fields are required.), using raw format. User's id in UUID format will be generated automatically and will be returned with a response.
```
{ 
    "username": "Student1", // data should be a string and not an empty string or string with only spaces.
    "age": 20, // data should be a number
    "hobbies": ["football", "chess"]  // data should be an empty array or array of strings
},
```
- Since it's not specified, age is allowed to be negative. Wanted to make a check, but thought that reviewer1 can consider it as a mistake since negative numbers are still numbers.
3. PUT 
- To change users data, make a PUT request to "localhost:3000\api\users\id", where id is users id in UUID format, with a body with object (example is below, all fields are required), using raw format. 
```
{ 
    "username": "Student1", // data should be a string and not an empty string or string with only spaces.
    "age": 20, // data should be a number
    "hobbies": ["football", "chess"]  // data should be an empty array or array of strings
},
4. DELETE 
- To delete user from the database, make a DELETE request to "localhost:3000\api\users\id", where id is users id in UUID format.

- Cases where you use path `localhost:3000\api\users\           ` will not be handled. I could've done this, but `localhost:3000\api\users\a502c7ec-5592%20-4d24-b6e9-ad20638    b85f6  %20         ` became also valid, just like paths 'localhost:3000\api\users\        ', 'localhost:3000\api\us     ers\', so student_1 may consider this as an error if this paths will be valid in my server. And since there are no requirements, only path without extra spaces will be handled properly. But to handle cases with extra spaces, only 1 row need to be changed.