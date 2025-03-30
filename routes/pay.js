var express = require("express")
var router = express.Router()
var paystack = require("paystack-api")(process.env.PAYSTACK_API_KEY)

router.post("/", async function (req, res, next) {
	if (!req.body) res.status(400).json({ message: "Bad request" })

	// Create Recipient

	const { account_number, account_name, bank_code, amount_to_be_paid } =
		req.body
	const reciever = await paystack.transfer_recipient.create({
		type: "nuban",
		name: account_name,
		account_number: account_number,
		bank_code: bank_code,
		currency: "NGN",
	})

	const recipientCode = await reciever.data.recipient_code

	// Initiative Transfer
	const initiateTransfer = await paystack.transfer.create({
		source: "balance",
		reason: "Most likely food",
		amount: Number(amount_to_be_paid),
		recipient: recipientCode,
	})

	if (initiateTransfer.status) {
		res.status(200).json({ success: true })
	}

	// C'est finis
})

module.exports = router
