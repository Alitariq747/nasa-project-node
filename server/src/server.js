const http = require("http");

require('dotenv').config()

const { mongoConnect } = require("../src/servcies/mongo");
const app = require("./app");

const { loadPlanetsData } = require("./models/planets.model");
const { loadLaunchesData } = require('./models/launches.model')

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

async function startServer() {
	await mongoConnect();

	await loadPlanetsData();
	await loadLaunchesData()

	server.listen(PORT, () => {
		console.log(`Server is listening at port: ${PORT}`);
	});
}

startServer();
