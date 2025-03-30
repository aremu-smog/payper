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
						{ type: "text", text: `${supportedBanks}` },
						{
							type: "text",
							text: `Analyze this image and return only a JSON object following the structure: 
							{"account_name": "", 
							"account_number":"",
							"bank_name":"", 
							bank_code:"use banks list supplied",
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

		console.log(message.content)
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

const supportedBanks = {
	banks: [
		{
			id: 688,
			name: "Moniepoint MFB",
			slug: "moniepoint-mfb-ng",
			code: "50515",
			longcode: "null",
			gateway: null,
			pay_with_bank: false,
			supports_transfer: true,
			active: true,
			country: "Nigeria",
			currency: "NGN",
			type: "nuban",
			is_deleted: false,
			createdAt: "2023-03-20T12:53:58.000Z",
			updatedAt: "2023-03-20T12:53:58.000Z",
		},
		{
			id: 629,
			name: "Paystack-Titan",
			slug: "titan-paystack",
			code: "100039",
			longcode: "",
			gateway: null,
			pay_with_bank: false,
			supports_transfer: true,
			active: true,
			country: "Nigeria",
			currency: "NGN",
			type: "nuban",
			is_deleted: false,
			createdAt: "2022-09-02T08:51:15.000Z",
			updatedAt: "2024-03-26T14:31:05.000Z",
		},
		{
			id: 20,
			name: "Wema Bank",
			slug: "wema-bank",
			code: "035",
			longcode: "035150103",
			gateway: null,
			pay_with_bank: false,
			supports_transfer: true,
			active: true,
			country: "Nigeria",
			currency: "NGN",
			type: "nuban",
			is_deleted: false,
			createdAt: "2016-07-14T10:04:29.000Z",
			updatedAt: "2021-02-09T17:49:59.000Z",
		},
		{
			id: 171,
			name: "OPay Digital Services Limited (OPay)",
			slug: "paycom",
			code: "999992",
			longcode: "",
			gateway: "ibank",
			pay_with_bank: true,
			supports_transfer: true,
			active: true,
			country: "Nigeria",
			currency: "NGN",
			type: "nuban",
			is_deleted: false,
			createdAt: "2020-11-24T10:20:45.000Z",
			updatedAt: "2025-01-22T17:04:57.000Z",
		},
	],
}
