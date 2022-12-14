//HTML 
const html = require('html');
const url = require('url');
const http = require('http'); 
const assert = require('assert');
//File
const fs = require('fs');
const formidable = require('express-formidable');
//MongoDB
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const mongourl = 'mongodb+srv://s1296848:Password1@cluster0.ew14v5x.mongodb.net/?retryWrites=true&w=majority';
const dbName = 'hkmu_inventory';

const express = require('express');
const app = express();
const session = require('cookie-session');

const bodyParser = require('body-parser');

const { Buffer } = require('safe-buffer');

var users = new Array(
    { name: "admin", password: "admin" },
    { name: "student", password: "student" }
);

var DOC = {};

//Main Body
app.set('view engine', 'ejs');
app.use(formidable());
//Middleware
app.use(bodyParser.json());
//Cookie
app.use(session({
    userid: "session",
    keys: ['th1s!sA5ecretK3y'],
    maxAge: 5 * 60 * 1000
}));

//functions
//create new inventory docs

const createDocument = (db, createDoc, callback) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to the DB server.");
        const db = client.db(dbName);

        db.collection('inventory').insertOne(createDoc, (error, results) => {
            if (error) throw error;
				console.log(results);
            //callback();
        });
    });
}
//find
const findDocument = (db, criteria, callback) => {
    let cursor = db.collection('inventory').find(criteria);
    console.log(`findDocument: `+criteria);
    cursor.toArray((err, docs) => {
        assert.equal(err, null);
        console.log(`findDocument: ${docs.length}`);
        callback(docs);
    });
}

const handle_Find = (req, res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to the DB server.");
        const db = client.db(dbName);
        callback()
        findDocument(db, {}, (docs) => {
            client.close();
            console.log("Closed DB connection.");
            res.status(200).render('home', { name: `${req.session.userid}`, ninventory: docs.length, inventory: docs });
        });
    });
}
/*
//detail
const handle_Details = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to DB server");
        const db = client.db(dbName);

        let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id);
        findDocument(db, DOCID, (docs) => {
            client.close();
            console.log("Closed DB connection");
            res.status(200).render('details', { inventory: docs[0] });
        });
    });
}
*/
//handling requests
app.get('/', (req, res) => {
	console.log(req.session.authenticated);
    if (req.session.authenticated) {
		res.redirect("/home");
    }else{
        console.log("...Not authenticated; directing to login");
        res.redirect("/login");
	}
    console.log("...Hello, welcome back");
   // handle_Find(req, res, {});
});

//login
app.get('/login', (req, res) => {
    console.log("...Welcome to login page");
    res.sendFile(__dirname + '/public/login.html');
    res.status(200).render("login");
});
app.post('/login', (req, res) => {
    console.log("...Handling your login request");
    users.forEach((user) => {
        if (user.name == req.fields.username && user.password == req.fields.password) {
            req.session.authenticated = true;
            req.session.userid = req.fields.username;
            console.log(req.session.userid);
            res.status(200).redirect("/home");
        }
    });
    res.redirect("/");
});

app.use((req, res, next) => {
    console.log("...Checking login status");
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect("/login");
    }
});
app.get('/logout', (req, res) => {
    req.session = null;
    req.authenticated = false;
    res.redirect('/');
});

//Home page
app.get('/home', (req, res) => {
    console.log("...Welcome to the home page!")
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to the DB server.");
		
        const db = client.db(dbName);
        //callback()
        findDocument(db, {}, (docs) => {
			client.close();
            console.log("Closed DB connection.");
			console.log(docs);
            res.status(200).render('home',{name: `${req.session.userid}` ,ninventory: docs.length, inventory: docs});
        });
		
    });
});

//create
app.get('/create', (req, res) => {
    res.status(200).render("create");
});
app.post('/create', (req, res) => {
    console.log("...create a new document!");
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to the DB server.");
        const db = client.db(dbName);

        // Get a timestamp in seconds
        var timestamp = Math.floor(new Date().getTime() / 1000);
        // Create a date with the timestamp
        var timestampDate = new Date(timestamp * 1000);

        // Create a new ObjectID with a specific timestamp
        var objectId = new ObjectID(timestamp);

        DOC["_id"] = objectId;
        DOC['inv_id'] = req.fields.inv_id;
        DOC['name'] = req.fields.Name;
        DOC['inv_type'] = req.fields.inv_type;
        DOC['quantity'] = req.fields.quantity;
        DOC['description'] = req.fields.inv_type;
        DOC['owner'] = req.fields.owner;
		console.log(req.files.photo);
		DOC['phototype'] = req.files.photo.type;
		fs.readFile(req.files.photo.path, (err,data) => {
			assert.equal(err,null);
			DOC['photo'] = new Buffer.from(data).toString('base64');
		});
        console.log("...putting data into DOC");
		console.log(DOC);
		console.log("...Creating the document");
		createDocument(db, DOC, (docs) => {
			client.close();
			console.log("Closed DB connection");
		});
		res.status(200).render('info', { message: "Document created successfully!" });
		console.log("document Created");
    });
});

//edit
app.get('/edit', (req, res) => {
    console.log("...Welcome to the edit page!");
	const client = new MongoClient(mongourl);
    client.connect((err) => {
		assert.equal(null, err);
        console.log("Connected successfully to the DB server.");
        const db = client.db(dbName);
		let parsedURL = url.parse(req.url,true);
        let DOCID = {};
        DOCID['_id'] = ObjectID(parsedURL.query.id)
		//const criteria = "{'_id':ObjectId('"+parsedURL.query.id+"')}";
        findDocument(db, DOCID, (docs) => {
			client.close();
            console.log("Closed DB connection.");
            console.log(docs);
			res.status(200).render("edit", {inventory: docs});
            //res.status(200).render('home',{name: `${req.session.userid}` ,ninventory: docs.length, inventory: docs});
        });
	});
	
});

app.post('/edit', (req, res) => {
    console.log("...edit a document!");
});

//update
app.get('/update', (req, res) => {
    console.log("...updating");
});

app.post('/update', (req, res) => {
    console.log("...Handling your update request");
	const client = new MongoClient(mongourl);
	console.log("111111");
    client.connect((err) => {
		console.log(req.fields.id);
		const db = client.db(dbName);
        let DOCID = {};
        DOCID['_id'] = ObjectID(req.fields.id);
        let DOCCH = {};
        DOCCH['inv_id'] = req.fields.inv_id;
        DOCCH['name'] = req.fields.Name;
        DOCCH['inv_type'] = req.fields.inv_type;
        DOCCH['quantity'] = req.fields.quantity;
        DOCCH['description'] = req.fields.description;
        DOCCH['owner'] = req.fields.owner;
		//if(req.files.photo.size>0){
			DOCCH['phototype'] = req.files.photo.type;
			fs.readFile(req.files.photo.path, (err,data) => {
				DOCCH['photo'] = new Buffer.from(data).toString('base64');
			});
		//}
		console.log(DOCCH);
		console.log("44444444444444444");
		db.collection('inventory').updateMany(DOCID,{$set: DOCCH}, (err,results) => {
			assert.equal(err,null);
			//console.log(results);
			console.log(`Updated document(s): ${results.result.nModified}`);
			res.status(200).render('info', { message: "Document updated successfully!" });
		});
	});
});

//detail
app.get('/details', (req, res) => {
    console.log("...Handling your 1 request");
	const client = new MongoClient(mongourl);
    client.connect((err) => {
		assert.equal(null, err);
        console.log("Connected successfully to the DB server.");
        const db = client.db(dbName);
		let parsedURL = url.parse(req.url,true);
        let DOCID = {};
        DOCID['_id'] = ObjectID(parsedURL.query.id)
		//const criteria = "{'_id':ObjectId('"+parsedURL.query.id+"')}";
        findDocument(db, DOCID, (docs) => {
			client.close();
            console.log("Closed DB connection.");
            console.log(docs);
			res.status(200).render("details", {inventory: docs});
            //res.status(200).render('home',{name: `${req.session.userid}` ,ninventory: docs.length, inventory: docs});
        });
	});
});

app.post('/details', (req, res) => {
    console.log("details");
});

//del
app.get('/del', (req, res) => {
	const client = new MongoClient(mongourl);
	console.log("1111112");
    client.connect((err) => {
		const db = client.db(dbName);
		let parsedURL = url.parse(req.url,true);
        let DOCID = {};
        DOCID['_id'] = ObjectID(parsedURL.query.id);
		console.log(parsedURL.query.id);
		db.collection('inventory').remove(DOCID, function(err, obj) {
			//console.log(results);
			console.log("22222221");
			res.status(200).render('info', { message: "Document deleted successfully!" });
		});
	});
});

app.post('/del', (req, res) => {
    console.log("details");
});

//search
app.get('/search', (req, res) => {
	console.log("222222222");
});

app.post('/search', (req, res) => {
	const client = new MongoClient(mongourl);
	console.log("11111123333");
    client.connect((err) => {
		const db = client.db(dbName);
        let DOCID = {};
        DOCID['name'] = req.fields.name;
        findDocument(db, DOCID, (docs) => {
			client.close();
            console.log("Closed DB connection.");
            console.log(docs);
			res.status(200).render("search", {name:`${req.fields.name}`,inventory: docs,ninventory: docs.length});
            //res.status(200).render('home',{name: `${req.session.userid}` ,ninventory: docs.length, inventory: docs});
        });
	});
});

//404
app.get('/*', (req, res) => {
    res.status(404).render("info", { message: `${req.path} - Unknown request!` })
});

app.listen(process.env.PORT || 8099);
