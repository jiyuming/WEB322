const Sequelize = require('sequelize');
var sequelize = new Sequelize('***', '***', '***', {
    host: 'ec2-75-101-131-79.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    operatorsAliases: false,
dialectOptions: {
ssl: true
    }
});

var Employee = sequelize.define('Employee',{
    employeeNum:
    {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addresCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    matritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    department: Sequelize.INTEGER,
    hireDate: Sequelize.STRING
});

var Department = sequelize.define('Department',{
    departmentId:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentName: Sequelize.STRING
});

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(()=>
            resolve()).catch((err)=>
            reject("unable to sync the database"));
    });       
}

module.exports.getAllEmployees = function() {
    return new Promise(function(resolve, reject) {
        Employee.findAll().then(function(data) { 
                resolve(data); 
        }).catch(function(err) { 
                reject('no results returned'); 
        });
    });
}

module.exports.getEmployeesByStatus = function(status) {
    return new Promise(function(resolve, reject) {
        Employee.findAll({
            where: { status: status }
        }).then(function(data) { 
            resolve(data);
        }).catch(function(err) {
            reject('no results returned'); 
        });
    });
}

module.exports.getEmployeesByDepartment = function(department){
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            where: { department: department }
        }).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject("no results returned");
        });
    });
}

module.exports.getEmployeesByManager = function(manager) {
    return new Promise(function(resolve, reject) {
        Employee.findAll({
            where: { employeeManagerNum: manager }
        }).then(function(data) {
            resolve(data); 
        }).catch(function(err) { 
            reject('no results returned'); 
        });
    });
}

module.exports.getEmployeeByNum = function(num){
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            where: { employeeNum: num }
        }).then((data) => {
            resolve(data[0]);
        }).catch((err) => {
            reject("no results returned");
        });
    });
}

module.exports.addEmployee = function (employeeData) {
    return new Promise(function (resolve, reject) {
        employeeData.isManager = (employeeData.isManager) ? true : false;
        for (let i in employeeData) {
            if (employeeData[i] == "") {
                employeeData[i] = null;
            }
        }
        Employee.create(employeeData)
            .then(() => {
                resolve();
            })
            .catch((err) => {
                reject("unable to add employee");
            });
    });
}

module.exports.updateEmployee = function(employeeData){
    return new Promise(function (resolve, reject) {
    
        employeeData.isManager = (employeeData.isManager) ? true : false;
        
        for (let i in employeeData) {
            if (employeeData[i] == "") {
                employeeData[i] = null;
            }
        }
        Employee.update(employeeData, {
            where: { employeeNum: employeeData.employeeNum } 
        })
        .then(() => {
            resolve();
            console.log('Operation "Updating an employee" was a success!')
        })
        .catch((err) => {
            reject("unable to update employee");
        });
    });
}

module.exports.deleteEmployeeByNum = (empNum) => {
    return new Promise(function (resolve, reject) {
        Employee.destroy({
            where: { employeeNum: empNum }
        }).then(function () {
            resolve();
        })
        .catch(function (err) {
            reject("unable to delete employee");
        });
    });
}

module.exports.getDepartments = function() {
    return new Promise(function(resolve, reject) {
        Department.findAll().then((data)=> { 
            resolve(data); 
        }).catch(function(err) { 
            reject('no results returned'); 
        });
    });
}

module.exports.addDepartment = function(departmentData){
    return new Promise(function (resolve, reject){
        for (let i in departmentData) {
            if(departmentData[i] == ""){
                departmentData[i] = null;
            }
        }
        Department.create({
            departmentId: departmentData.departmentId,
            departmentName: departmentData.departmentName
        }).then(() => {
            resolve(Department);
        }).catch((err) => {
            reject("unable to create department.");
        });
    }).catch(() => {
        reject("unable to create department.");
    });
}

module.exports.updateDepartment = (departmentData) => {
    return new Promise((resolve, reject) => {
        for(let x in departmentData){
            if(departmentData[x] == "") {
                departmentData[x] = null;
            }
        }
        Department.update({
            departmentName: departmentData.departmentName
        }, { where: {
            departmentId: departmentData.departmentId
        }}).then(() =>{
            resolve(Department);
        }).catch((err) => {
            reject("unable to create department.");
        });
    }).catch(() => {
        reject("unable to create department.");
    });
}

module.exports.getDepartmentById = (id) => {
    return new Promise((resolve, reject) => {
        Department.findAll({
            where: { departmentId: id }
        }).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject("no results returned");
        });
    });
}

module.exports.deleteDepartmentById = (id) => {
    return new Promise(function (resolve, reject) {
        Department.destroy({
            where: { departmentId: id }
        }).then(() => {
            resolve();
        })
        .catch((err) => {
            reject("Unable to delete department");
        });
    });
}