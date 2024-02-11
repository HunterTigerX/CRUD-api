(()=>{"use strict";const e=require("http"),t=require("path"),n=require("cluster"),i=require("os"),s=JSON.parse('{"_":[{"id":"a502c7ec-5592-4d24-b6e9-ad20638b85f6","username":"Student1","age":20,"hobbies":["football","chess"]},{"id":"b015cf2b-a6f3-4aa3-8185-83670d1f3fa1","username":"Reviewer1","age":22,"hobbies":["basketball","piano"]}]}');async function a(){const e={id:"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,(function(e){let t=16*Math.random()|0;return("x"==e?t:3&t|8).toString(16)}))};return Promise.resolve(e)}async function o(e){return Promise.resolve(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(e))}const r=process.argv.slice(2,3).toString().split("=")[1],d=Number("single"===r?"3000":"4000"),l=i.availableParallelism(),p=t.sep,c=JSON.stringify({message:"Invalid userId (not in uuid format)"}),y=JSON.stringify({message:"Invalid data in request. Probably you are using invalid data type for object key's value"}),f=JSON.stringify({message:"Your body might contain errors and cannot be converted to JSON"}),u=JSON.stringify({message:"Request body does not contain required fields or have extra fields"}),g=JSON.stringify({message:"Your url does not contain user ID"}),H=JSON.stringify({message:"User with this ID was not found"}),w=JSON.stringify({message:"Resource that you requested doesn't exist"}),x=JSON.stringify({message:"Your body is missing required fields"}),m=JSON.stringify({message:"Resource that you requested doesn't exist. You should post to localhost:3000/api/users/"}),b=async function(e,n){let i="";async function r(e){try{return JSON.parse(e),Promise.resolve(JSON.parse(e))}catch(e){return Promise.resolve("Invalid body")}}async function d(e){const t=["username","age","hobbies"],n=Object.keys(e);return Promise.resolve(n.length===t.length&&n.every((e=>t.includes(e))))}async function l(e){let t=e.username,n=e.age,i=e.hobbies;"string"==typeof n&&(n=n.trim()),"string"==typeof t&&(t=t.trim());let s="string"==typeof t&&isNaN(t)&&0!==t.length,a=!isNaN(n)&&null!==n&&0!==n.length,o=Array.isArray(i)&&(i.every((e=>"string"==typeof e))||0===i.length);return Promise.resolve(s&&a&&o)}await new Promise(((t,n)=>{e.on("data",(e=>{i+=e})),e.on("end",(()=>{t()}))}));const b=e.method,h=t.normalize(e.url).split(p);""===h[h.length-1]&&h.pop();let j=h.length>=4?h[3]:void 0,T="api"===h[1]&&"users"===h[2];const C=3===h.length;if(h.length>4)n.setHeader("Content-Type","application/json"),n.writeHead(404),n.end(w);else if("GET"===b)if(T&&C)n.setHeader("Content-Type","application/json"),n.writeHead(200),n.end(JSON.stringify(s._));else if(T&&j)if(await o(j)){const e=s._.find((e=>e.id===j));e?(n.setHeader("Content-Type","application/json"),n.writeHead(200),n.end(JSON.stringify(e))):(n.setHeader("Content-Type","application/json"),n.writeHead(404),n.end(H))}else n.setHeader("Content-Type","application/json"),n.writeHead(400),n.end(c);else n.setHeader("Content-Type","application/json"),n.writeHead(404),n.end(w);else if("POST"===b)if(T&&C){const e=await r(i);if("Invalid body"===e)n.setHeader("Content-Type","application/json"),n.writeHead(500),n.end(f);else if(await d(e))if(!1===await l(e))n.setHeader("Content-Type","application/json"),n.writeHead(500),n.end(y);else{let t=await a();const i=s._.find((e=>e.id===t));for(;i;)t=await a();e.age=Number(e.age);const o=Object.assign(t,e);s._.push(o),n.setHeader("Content-Type","application/json"),n.writeHead(201),n.end(JSON.stringify(o))}else n.setHeader("Content-Type","application/json"),n.writeHead(400),n.end(x)}else n.setHeader("Content-Type","application/json"),n.writeHead(404),n.end(m);else if("PUT"===b)if(T&&C)n.setHeader("Content-Type","application/json"),n.writeHead(400),n.end(g);else if(T&&j)if(await o(j)){const e=s._.find((e=>e.id===j));if(e){const t=await r(i);if("Invalid body"===t)n.setHeader("Content-Type","application/json"),n.writeHead(500),n.end(f);else if(await d(t))if(!1===await l(t))n.setHeader("Content-Type","application/json"),n.writeHead(500),n.end(y);else{const i={id:e.id},a=Object.assign(i,t);s._.map(((e,t)=>{e.id===j&&(s._[t]=a)})),n.setHeader("Content-Type","application/json"),n.writeHead(200),n.end(JSON.stringify(a))}else n.setHeader("Content-Type","application/json"),n.writeHead(400),n.end(u)}else n.setHeader("Content-Type","application/json"),n.writeHead(404),n.end(H)}else n.setHeader("Content-Type","application/json"),n.writeHead(400),n.end(c);else n.setHeader("Content-Type","application/json"),n.writeHead(404),n.end(m);else"DELETE"===b?T&&C?(n.setHeader("Content-Type","application/json"),n.writeHead(400),n.end(g)):T&&j?await o(j)?s._.find((e=>e.id===j))?(s._.map(((e,t)=>{e.id===j&&s._.splice(t,1)})),console.log("here"),n.setHeader("Content-Type","application/json"),n.writeHead(204),n.end()):(n.setHeader("Content-Type","application/json"),n.writeHead(404),n.end(H)):(n.setHeader("Content-Type","application/json"),n.writeHead(400),n.end(c)):(n.setHeader("Content-Type","application/json"),n.writeHead(404),n.end(m)):(n.setHeader("Content-Type","application/json"),n.writeHead(404),n.end(w))};if(n.isPrimary){e.createServer(((e,t)=>{const i=n.workers[h];h=(h+1)%l,i.send("request",{req:e,res:t})})).listen(d,(()=>{console.log(`Load balancer listening on port ${d}`)}));for(let e=0;e<l-1;e++)n.fork();n.on("exit",((e,t,n)=>{console.log(`Worker ${e.process.pid} died`)}))}else{const t=e.createServer(b);process.on("message",(e=>{"request"===e.type&&e.req.pipe(e.res)}));const i=d+n.worker.id;t.listen(i,(()=>{console.log(`Worker ${n.worker.id} listening on port ${i}`)}))}let h=0})();