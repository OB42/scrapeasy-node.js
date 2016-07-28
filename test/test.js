var scrapeasy = require(__dirname + "/../scrapeasy");
var fs = require("fs");
var toTest = JSON.parse(fs.readFileSync(__dirname + "/test.json"));
require("http").createServer((req, res) => {
    res.end(fs.readFileSync(__dirname + "/test.html"))
}).listen(7357);
var t = Object.getOwnPropertyNames(toTest)
var i = 0;
function test(type) {
    scrapeasy("http://localhost:7357", toTest[type].pattern, function(err, data) {
        if(JSON.stringify(data) === JSON.stringify(toTest[type].expected)){
            console.log(type, '\x1b[32mPASSING\x1b[0m');
        }
        else{
            console.log(type, '\x1b[31mFAILING\x1b[0m');
        }
        if(i < t.length){
            test(t[i++]);
        }
        else{
            console.log("DONE");
            process.exit();
        }
    })
}
test(t[i++]);
