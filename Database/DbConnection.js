var mysql = require('mysql');

//Aniket's database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '@Aniket1',
  database: 'samsunghealth',
  port: '3306'
});


/*
//sagar's remote database
const connection = mysql.createConnection({
  host: '172.31.2.3',
  user: 'root',
  password: '!@Sagar96',
  database: 'health',
  port: '3306'
});
*/

connection.connect(function (err) {
  if (!err) {
    console.log("Database is connected");
  } else {
    console.log("Error connecting database");
  }
});
module.exports = connection;