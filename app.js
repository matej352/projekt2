const express = require('express');
const dotenv = require('dotenv');
const https = require("https");
const path = require('path');
const { Pool } = require('pg')


const pool = new Pool({
	user: "adminko",
	host: "dpg-cdhv41un6mpue9hi40ig-a.frankfurt-postgres.render.com",
	database: 'vulnerable_db',
	password: "xM5OiXstfF4LqbXJTt7xRyD34bYRxaaj",
	port: 5432,
	ssl : true

	
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

app.get('/home', async function (req, res) {

	const students = await getComments();
	//console.log(students)
	res.render('home', {
        students: students
    });
});

//const homeController = require('./controllers/homeController');

//app.use(homeController);



async function getComments() {
	
	const results = await (await pool.query('SELECT * from Student')).rows;
	return results;
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