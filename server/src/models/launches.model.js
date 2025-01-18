const axios = require('axios')

const launchesInDatabase = require("./launches.mongo");
const planets = require("./planets.mongo");


const launch = {
	flightNumber: 100,
	mission: "Kepler Exploration X",
	rocket: "Explorer IS1",
	launchDate: new Date("December 27, 2030"),
	target: "Kepler-442 b",
	customer: ["ZTM", "NASA"],
	upcoming: true,
	success: true,
};

// saveLaunch(launch);

const SPACE_X_API_URL = "https://api.spacexdata.com/v4/launches/query";

async function populateLaunches() {
	console.log("Loading Launches Data!");
	const response = await axios.post(SPACE_X_API_URL, {
		query: {},
		options: {
			pagination: false,
			populate: [
				{
					path: "rocket",
					select: {
						name: 1,
					},
				},
				{
					path: "payloads",
					select: {
						customers: 1,
					},
				},
			],
		},
	});
	if (!response.status === 'ok') {
		throw new Error('Loading launches data failed!')
	}
	const launchDocs = response.data.docs;
	for (const launchDoc of launchDocs) {
		const payloads = launchDoc["payloads"];
		const customers = payloads.flatMap((payload) => {
			return payload["customers"];
		});

		const launch = {
			flightNumber: launchDoc["flight_number"],
			mission: launchDoc["name"],
			rocket: launchDoc["rocket"]["name"],
			launchDate: launchDoc["date_local"],
			upcoming: launchDoc["upcoming"],
			success: launchDoc["success"],
			customers,
		};
		await saveLaunch(launch)
	}
}

async function loadLaunchesData() {
	const firstLaunch = await findLaunch({
		flightNumber: 1,
		rocket: 'Falcon 1',
		mission: 'FalconSat'
	})
	if (firstLaunch) {
		console.log('Launches already exist; aborting API request');
		
	} else {
		populateLaunches()
	}
	
	
}

async function findLaunch(filter) {
	return await launchesInDatabase.findOne(filter)
}

async function launchExistsWithId(launchId) {
	return await findLaunch({ flightNumber: launchId });
}

async function getAllLaunches(skip, limit) {
	
	return await launchesInDatabase.find(
		{},
		{
			_id: 0,
			__v: 0,
		}
	).sort({flightNumber: 1}).limit(limit).skip(skip)
}

async function getLatestFlightNumber() {
	const latestLaunch = await launchesInDatabase.findOne().sort("-flightNumber");

	if (!latestLaunch) {
		return 100;
	}

	return latestLaunch.flightNumber;
}

async function saveLaunch(launch) {
	

	await launchesInDatabase.findOneAndUpdate(
		{
			flightNumber: launch.flightNumber,
		},
		launch,
		{
			upsert: true,
		}
	);
}

async function scheduleNewLaunch(launch) {
	const planet = await planets.findOne({
		keplerName: launch.target,
	});

	if (!planet) {
		throw new Error("No planet found!!");
	}
	const newFlightNumber = (await getLatestFlightNumber()) + 1;

	const newLaunch = Object.assign(launch, {
		success: true,
		upcoming: true,
		customers: ["Zero to mastery", "NASA"],
		flightNumber: newFlightNumber,
	});

	await saveLaunch(newLaunch);
}

// function addNewLaunch(launch) {
// 	latestFlightNumber++;
// 	launches.set(
// 		latestFlightNumber,
// 		Object.assign(launch, {
// 			flightNumber: latestFlightNumber,
// 			upcoming: true,
// 			customer: ["Zero to mastery", "NASA"],
// 			success: true,
// 		})
// 	);
// }

async function abortLaunchById(launchId) {
	const aborted = await launchesInDatabase.updateOne(
		{
			flightNumber: launchId,
		},
		{
			upcoming: false,
			success: false,
		}
	);

	return aborted.modifiedCount === 1;
}

module.exports = {
	loadLaunchesData,
	getAllLaunches,
	scheduleNewLaunch,
	launchExistsWithId,
	abortLaunchById,
};
