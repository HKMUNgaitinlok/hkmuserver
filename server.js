//HTML 
const html = require('html');
const url = require('url');

app.set('view engine', 'ejs');
app.use(formidable());

//Middleware
app.use(bodyParser.json());
//Cookie
app.use(session({
    userid: "session",  
    keys: ['th1s!sA5ecretK3y'],
    //maxAge: 90 * 24 * 60 * 60 * 1000
}));

//handling requests
app.get('/', (req, res)=>{
    if(!req.session.authenticated){
        console.log("...Not authenticated; directing to login");
        res.redirect("/login");
    }
    console.log("...Hello, welcome back");
    handle_Find(req, res, {});
});
//login
app.get('/login', (req, res)=>{
    console.log("...Welcome to login page");
    res.sendFile(__dirname + '/public/login.html');
    res.status(200).render("login");
});

app.post('/login', (req, res)=>{
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
    if (req.session.authenticated){
      next();
    } else {
      res.redirect("/login");
    }
});

app.get('/logout', (req, res)=>{
    req.session = null;
    req.authenticated = false;
    res.redirect('/');
});