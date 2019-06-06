/*********************************************************************************
* WEB322 – Assignment 06
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: ____Yuming Ji____ Date: ____Apr 12nd,2019_____
*
* Online (Heroku) Link:  https://secret-stream-21138.herokuapp.com/
*
********************************************************************************/
var dataService = require('./data-service.js');
var express = require('express');
var app = express();
var path = require('path');
var dataServiceAuth = require('./data-service-auth.js');
var clientSessions = require("client-sessions");

//ensure login declaration
function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect("/login");
    } else {
      next();
    }
  }

var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({
     extname: '.hbs',
     defaultLayout: 'main', 
     helpers:{
     navLink: function(url, options){
        return '<li' + 
            ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
            '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    },
    equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    }
    }
}));
app.set('view engine', '.hbs');

var HTTP_PORT = process.env.PORT || 8080;

var multer = require('multer');
var storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function (req, file, cb){
        cb(null, Date.now()+path.extname(file.originalname));
    }
});

var upload = multer({storage : storage});

var fs = require('fs');

var bodyParser = require ('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
  }

app.use(express.static('public'));

app.use(function(req,res,next){
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});

//setting up css
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.static(path.join(__dirname, "/public/css")));

//Client-Sessions setup
app.use(clientSessions({
    cookieName: "session",
    secret: "senhalongadaweb322secreta",
    duration: 2 * 60* 1000,
    activeDuration: 1000 * 60
}));

//seeting up the session object
app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

//goes to the home page
app.get("/", function(req, res){
    res.render("home");
});

//goes to the about page
app.get("/about", function(req, res){
    res.render("about");
});


//get all employees, by dept, status, or manager
app.get("/employees", ensureLogin, (req, res) =>{
    if(req.query.status){
        dataService.getEmployeesByStatus(req.query.status)
        .then((data)=>{
            if(data.length > 0){
                res.render("employeeList", {employees: data});//
            }
            else{
                res.render("employeeList", {message: "no results"})//
            }    
        }).catch(()=>{
            res.render({message: "no results"});
        });
    }
    else if (req.query.department) {
        dataService.getEmployeesByDepartment(req.query.department).then((data) => {
            if (data.length > 0) {
                res.render("employeeList", {employees: data});//
            }
            else{
                res.render("employeeList",{ message: "no results" });//
            }
            
        }).catch((err) => {
            res.render("employeeList", {message: "no results"});//
        });
    }
    else if(req.query.manager){
        dataService.getEmployeesByManager(req.query.manager).then((data)=>{
            if(data.length > 0){
                res.render("employeeList", {employees: data});//
            }
            else{
                res.render("employeeList", {message: "no results"})//
            }
        }).catch(()=>{
            res.render({message: "no results"});
        });
    }
    else{
        dataService.getAllEmployees().then(function(data){
            if(data.length > 0){
                res.render("employeeList", {employees: data});//
            }
            else{
                res.render("employeeList", {message: "no results"})//
            }
        }).catch(()=>{
            res.render({message: "no results"});
        });
    }
});

//get an employee by number using req.params
app.get("/employee/:empNum", ensureLogin, (req, res) => {
    // initialize an empty object to store the values
    let viewData = {};
dataService.getEmployeeByNum(req.params.empNum).then((data) => {
        if (data) {
viewData.employee = data; //store employee data in the "viewData" object as "employee"
        } else {
viewData.employee = null; // set employee to null if none were returned
        }
    }).catch(() => {
viewData.employee = null; // set employee to null if there was an error 
    }).then(dataService.getDepartments)
.then((data) => {
viewData.departments = data; // store department data in the "viewData" object as "departments"

        // loop through viewData.departments and once we have found the departmentId that matches
        // the employee's "department" value, add a "selected" property to the matching 
        // viewData.departments object
        for (let i = 0; i<viewData.departments.length; i++) {
            if (viewData.departments[i].departmentId == viewData.employee.department) {
viewData.departments[i].selected = true;
            }
        }
    }).catch(() => {
viewData.departments = []; // set departments to empty if there was an error
    }).then(() => {
        if (viewData.employee == null) { // if no employee - return an error
res.status(404).send("Employee Not Found");
        } else {
res.render("employee", { viewData: viewData }); // render the "employee" view
        }
    });
});

//goes to the add employee page
app.get("/employees/add", ensureLogin, (req, res) => {
    dataService.getDepartments().then((data) => {
        res.render("addEmployee",{departments: data});
    }).catch((err) => {
        res.render("addEmployee", {departments: []});
    });
});

//delete an emp
app.get("/employees/delete/:empNum", ensureLogin, (req, res) => {
    dataService.deleteEmployeeByNum(req.params.empNum).then((data) => {
        res.redirect("/employees");
    }).catch((err) => {
        res.status(500).send("Unable to Remove Employee / Employee not found");
    });   
});

//adds employee
app.post("/employees/add", ensureLogin, (req, res) => {
    dataService.addEmployee(req.body)
      .then(() => {
        res.redirect("/employees");
      });
  });

//update employee
app.post("/employee/update", ensureLogin, (req, res) => {
    dataService.updateEmployee(req.body)
    .then(res.redirect("/employees"))
});


//departments
app.get("/departments", ensureLogin, (req, res) => {

    dataService.getDepartments().then((data)=>{
        if(data.length > 0){
            res.render("departmentList", {departments: data});
        }
        else{
            res.render("departmentList", {message: "no results"})
        }
    }).catch(()=>{
        res.render({message: "no results"});
    });
});

//goes to the add department page
app.get("/departments/add", ensureLogin, (req, res) => {
    res.render("addDepartment"); 
});

//adds department
app.post("/departments/add", ensureLogin, (req, res) => {
    dataService.addDepartment(req.body)
      .then(() => {
        res.redirect("/departments");
    });
});

//update department
app.post("/department/update", ensureLogin, (req, res) => {
    dataService.updateDepartment(req.body)
    .then(res.redirect("/departments"))
});

//get a department by number
app.get("/department/:departmentId", ensureLogin, (req, res) => {
    dataService.getDepartmentById(req.params.departmentId).then((data) => {
        res.render("department", { department: data });
    }).catch((err) => {
        res.status(404).send("Department Not Found");
    });
});

//delete a department
app.get("/departments/delete/:departmentId", ensureLogin, (req, res) => {
    dataService.deleteDepartmentById(req.params.departmentId).then((data) => {
        res.redirect("/departments");//
    }).catch((err) => {
        res.status(500).send("Unable to Remove Department / Department not found");
    });
});


//IMAGES
app.get("/images",ensureLogin, (req,res)=>{
    fs.readdir(path.join(__dirname,"/public/images/uploaded"), function(err,files){
        //var images = [];
        var imageList = { images: [] };
        for(var i=0; i< files.length; i++){
        //images.push(files[i]);
        imageList.images.push(files[i]);
        }
        //res.json(images);
        res.render("images", imageList)
       //res.render("images", {data:images})
    });
});

//goes to the add image page
app.get("/images/add", ensureLogin, (req, res) => {
    res.render("addImage");
});

//uploads images
app.post("/images/add", ensureLogin, upload.single("imageFile"), (req, res)=>{
    res.redirect("/images"); 
});

// /login get route
app.get("/login", (req, res) => {
    res.render("login");
});

// /login post route
app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    dataServiceAuth.checkUser(req.body)
    .then((user) => {
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        }
        res.redirect("/employees");    
    })
    .catch((err) => {res.render("login", {errorMessage: err, userName: req.body.userName})})
});

// /register get route
app.get("/register", (req, res) => {
    res.render("register");
});

// /register post route
app.post("/register", (req, res) => {
    dataServiceAuth.RegisterUser(req.body)
    .then(() => {res.render("register", {successMessage: "User created"})})
    .catch((err) => {res.render("register", {errorMessage: err, userName: req.body.userName})})
});

// /logout get route
app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/login");
});

// /userHistory get route
app.get ("/userHistory", ensureLogin, (req,res) => {
    res.render("userHistory", {user: req.session.user});
})

app.get("*", function(req, res){
    res.status(404).send("Page Not Found");
});

dataService.initialize()
.then(dataServiceAuth.Initialize())
.then(function(){
    app.listen(HTTP_PORT, onHttpStart)})
    .catch(function(err){console.log(err)});