const {
	getAllLaunches,
	launchExistsWithId,
	abortLaunchById,
	scheduleNewLaunch,
} = require("../../models/launches.model");

const paginate = require("../../servcies/query");

async function httpGetAllLaunches(req, res) {
	const { skip, limit } = paginate(req.query);
	const launches = await getAllLaunches(skip, limit);
	res.status(200).json(launches);
}

async function httpAddNewLaunch(req, res) {
	const launch = req.body;

	if (
		!launch.mission ||
		!launch.rocket ||
		!launch.target ||
		!launch.launchDate
	) {
		return res.status(400).json({
			error: "Incomplete data. Please recheck",
		});
	}

	launch.launchDate = new Date(launch.launchDate);
	if (isNaN(launch.launchDate)) {
		return res.status(400).json({
			error: "Invalid Date entered",
		});
	}

	await scheduleNewLaunch(launch);

	return res.status(201).json(launch);
}

async function httpAbortLaunchWithId(req, res) {
	const launchId = Number(req.params.id);

	const existLaunch = await launchExistsWithId(launchId);

	if (!existLaunch) {
		return res.status(404).json({ err: "The launch does not exist" });
	}

	const aborted = abortLaunchById(launchId);

	if (!aborted) {
		return res.status(400).json({
			error: "Aborting the launch failed",
		});
	}

	return res.status(200).json({
		ok: true,
	});
}

module.exports = {
	httpGetAllLaunches,
	httpAddNewLaunch,
	httpAbortLaunchWithId,
};
