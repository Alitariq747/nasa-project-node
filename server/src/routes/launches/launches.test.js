const request = require('supertest')
const app = require('../../app')
const { mongoConnect, mongoDisconnect } = require('../../servcies/mongo')
const { loadPlanetsData } = require('../../models/planets.model')

describe('Test Launches API', () => {
	beforeAll(async () => {
		await mongoConnect()
		await loadPlanetsData()
	})

	afterAll(async () => {
		await mongoDisconnect()
	})
describe("Test GET /launches", () => {
	test("should respond with a 200 response", async () => {
		const response = await request(app).get("/launches").expect(200);
	});
});

describe("Test Post /launches", () => {
	const completeLaunchData = {
		mission: "US Enterprises",
		target: "Kepler-62 f",
		rocket: "NCC 17D",
		launchDate: "January 19 2029",
	};

	const launchDataWithoutDate = {
		mission: "US Enterprises",
		target: "Kepler-62 f",
		rocket: "NCC 17D",
	};

	const launchDataWIthInvalidDate = {
		mission: "US Enterprises",
		target: "Kepler-62 f",
		rocket: "NCC 17D",
		launchDate: "Hello world",
	};
	test("should respond with 201 created", async () => {
		const response = await request(app)
			.post("/launches")
			.send(completeLaunchData)
			.expect(201)
			.expect("Content-Type", /json/);

		const requestDate = new Date(completeLaunchData.launchDate).valueOf();
		const responseDate = new Date(response.body.launchDate).valueOf();

		expect(requestDate).toBe(responseDate);

		expect(response.body).toMatchObject(launchDataWithoutDate);
	});
	test("It should catch misisng properties", async () => {
		const response = await request(app)
			.post("/launches")
			.send(launchDataWithoutDate)
			.expect(400);

		expect(response.body).toStrictEqual({
			error: "Incomplete data. Please recheck",
		});
	});
	test("It should validate the date", async () => {
		const response = await request(app)
			.post("/launches")
			.send(launchDataWIthInvalidDate)
			.expect(400);

		expect(response.body).toStrictEqual({
			error: "Invalid Date entered",
		});
	});
});
})


