var express = require("express")
var router = express.Router()
const anthropic = require("@anthropic-ai/sdk")
const multer = require("multer")
const fs = require("fs")
const path = require("path")

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY

const anthropicClient = new anthropic.Anthropic({ apiKey: CLAUDE_API_KEY })

// Configure multer for file uploads
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "uploads/")
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + path.extname(file.originalname.toLowerCase()))
	},
})

const upload = multer({
	storage: storage,
	fileFilter: function (req, file, cb) {
		// Accept images only
		if (!file.originalname.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
			return cb(new Error("Only image files are allowed!"), false)
		}
		cb(null, true)
	},
})

router.get("/", function (req, res, next) {
	res.status(200).json({ message: "All good" })
})

router.post("/", upload.single("image"), async function (req, res, next) {
	console.log("Time to start analysis")
	try {
		if (!req.file) {
			return res.status(400).json({ message: "No image uploaded" })
		}

		// Read the uploaded file as base64
		const imagePath = req.file.path
		const imageBuffer = fs.readFileSync(imagePath)
		const base64Image = imageBuffer.toString("base64")
		const mimeType = `image/${path
			.extname(req.file.originalname)
			.substring(1)}`.toLowerCase()

		const message = await anthropicClient.messages.create({
			max_tokens: 1024,
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: `Analyze this image and return only a JSON object following the structure: 
							{"account_name": "", 
							"account_number":"",
							"bank_name":"", 
							"bank_code":"extract from this list of banks: ${JSON.stringify(
								supportedBanks
							)} based on the bank name ",
							"amount_to_be_paid":"ensure value is in kobo"
							}`,
						},
						{
							type: "image",
							source: {
								type: "base64",
								media_type: mimeType,
								data: base64Image,
							},
						},
					],
				},
			],
			model: "claude-3-5-sonnet-latest",
		})

		const details = []

		const jsonData = JSON.parse(message.content[0].text)
		const objectKeys = Object.keys(jsonData)

		await objectKeys.forEach(objectKey => {
			details.push({
				field: objectKey,
				value: jsonData[objectKey],
			})
		})
		res.status(200).json({
			data: {
				paymentDetails: details,
				image: base64Image,
			},
		})

		// Clean up the uploaded file
		fs.unlinkSync(imagePath)
	} catch (error) {
		console.error("Error:", error)
		res.status(500).send(`Error processing image: ${error.message}`)
	}
})

module.exports = router

const supportedBanks = [
	{
		name: "Moniepoint MFB",
		code: "50515",
	},
	{
		name: "Paystack-Titan",
		code: "100039",
	},
	{
		name: "Wema Bank",
		code: "035",
	},
	{
		id: 171,
		name: "OPay Digital Services Limited (OPay)",
		code: "999992",
	},
]
