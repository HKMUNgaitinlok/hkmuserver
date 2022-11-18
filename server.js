'use strict';
var http = require('http');
var port = process.env.PORT || 1337;

http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello 11111111122221World1\n');
}).listen(port);


//redirect
//handling requests
app.get('/', (req, res) => {
    if (!req.session.authenticated) {
        console.log("...Not authenticated; directing to login");
        res.redirect("1.txt");
    }
    console.log("...Hello, welcome back");
    handle_Find(req, res, {});
});