const express = require('express');
const dotenv = require('dotenv');
const https = require("https");
const path = require('path');
const { Pool } = require('pg')
const bcrypt = require("bcrypt")


const pool = new Pool({
	user: "adminko",
	host: "dpg-cdhv41un6mpue9hi40ig-a.frankfurt-postgres.render.com",
	database: 'vulnerable_db',
	password: "xM5OiXstfF4LqbXJTt7xRyD34bYRxaaj",
	port: 5432,
	ssl: true


});





const bodyParser = require('body-parser');

var fs = require('fs');

const externalUrl = process.env.RENDER_EXTERNAL_URL;
const PORT = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 3000;



dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, '/public')));


app.get('/', (req, res) => {

	res.redirect('home');
});


app.get('/safe', async function (req, res) {

	//const student = await getStudent();
	//console.log(students)
	let student;
	const studentId = req.app.get('safeid');

	const account = req.app.get('safeaccount');

	if (studentId) {
		student = await getStudent(studentId);
		//console.log(student)
	}
	res.render('safe', {
		student: student,
		account: account
	});
});

app.get('/vulnerable', async function (req, res) {

	const studentId = req.app.get('vulnerableid');

	const account = req.app.get('vulnerableaccount');

	let student;

	if (studentId) {
		student = await getStudent(studentId);
	}


	

	res.render('vulnerable', {
		student: student,
		account: account
	});
});



app.get('/home', async function (req, res) {

	//const student = await getStudent();
	//console.log(students)
	res.render('home', {
		student: null,
	});
});



app.post('/getStudent', function (req, res) {
	var studentId = req.body.studentId;

	var loggedInStudentsId = req.query.id;

	if (!validateUserInput(studentId)) {
		const message = "SQL injection stopped!"
		req.app.set('message', message);
		res.redirect('error');
	}
	else if (studentId !== loggedInStudentsId) {
		const message = "You do not have permission to view other student's personal data!"
		req.app.set('message', message);
		res.redirect('error');
	}

	else {
		req.app.set('safeid', studentId);
		res.redirect('safe');
	}



});


app.post('/getStudentV', async function (req, res) {
	var studentId = req.body.studentId;

	req.app.set('vulnerableid', studentId);
	res.redirect('vulnerable');

});



app.post('/createAccountV', async function (req, res) {


	var accountData = req.body;
	//console.log(accountData)

	let id = await getLatestId() + 1;
	//console.log(id)
	let student = {
		id: id,
		jmbag: accountData.jmbag,
		firstname: accountData.firstname,
		lastname: accountData.lastname,
		email: accountData.email,
		password: accountData.password,
		salt: null
	};

	await createStudent(student);

	const createdStudent = await getStudent(id);
	req.app.set('vulnerableaccount', createdStudent);
	res.redirect('vulnerable');


});

app.post('/createAccount', async function (req, res) {


	var accountData = req.body;
	//console.log(accountData)

	const salt = await bcrypt.genSalt(10);
	const password = await bcrypt.hash(accountData.password, salt);

	
	let id = await getLatestId() + 1;
	let student = {
		id: id,
		jmbag: accountData.jmbag,
		firstname: accountData.firstname,
		lastname: accountData.lastname,
		email: accountData.email,
		password: password,
		salt: salt
	};

	await createStudent(student);

	const createdStudent = await getStudent(id);
	req.app.set('safeaccount', createdStudent);
	res.redirect('safe');




});



app.get('/error', async function (req, res) {
	const message = req.app.get('message');
	res.render('error', {
		errorMsg: message
	});

});




async function getStudent(studentId) {
	const query = 'SELECT * FROM Student WHERE id = ' + studentId + ';'

	try {
		const results = await (await pool.query(query)).rows;
		return results;
	}
	catch (err) {
		console.log(err)
	}
}

async function createStudent(obj) {
	let insert_into_query;
	if (obj.salt) {
		insert_into_query = "INSERT INTO Student VALUES (" + obj.id + ",'" + obj.jmbag  +"','" + obj.firstname + "','" + obj.lastname + "','" + obj.password + "','" + obj.salt + "','" + obj.email + "')";
	} else {
		insert_into_query = "INSERT INTO Student VALUES (" + obj.id + ",'" + obj.jmbag  +"','" + obj.firstname + "','" + obj.lastname + "','" + obj.password + "'," + obj.salt + ",'" + obj.email + "')";
	}

	console.log(insert_into_query)

	try {
		const results = await (await pool.query(insert_into_query)).rows;
		return results;
	}
	catch (err) {
		console.log(err)
	}
}

async function getLatestId() {
	const query = 'SELECT id FROM Student ORDER BY id DESC LIMIT 1'

	try {
		const result = await (await pool.query(query)).rows[0].id;
		return result;
	}
	catch (err) {
		console.log(err)
	}
}

function validateUserInput(userInput) {
	//regex for only numbers --> because id is INTEGER type
	const re = /^[0-9]*$/;
	//console.log(userInput)
	if (userInput == "" || re.test(userInput) == false) {
		return false;
	}

	return true;
}





if (externalUrl) {
	const hostname = '127.0.0.1';
	app.listen(PORT, hostname, () => {
		console.log(`Server locally running at http://${hostname}:${PORT}/ and from
	outside on ${externalUrl}`);
	});
} else {
	https.createServer({
		key: fs.readFileSync('server.key'),
		cert: fs.readFileSync('server.cert')
	}, app)
		.listen(PORT, function () {
			console.log(`Server running at https://localhost:${PORT}/`);
		});
}