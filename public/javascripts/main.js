const uploadForm = document.querySelector("#uploadForm")
const receiptImage = document.querySelector("#image")
const imagePreview = document.querySelector("#preview")
const submitButton = document.querySelector("#submitButton")
const infoArea = document.querySelector("#info")
const paymentButton = document.querySelector("#paymentButton")

imagePreview.addEventListener("click", () => receiptImage.click())
receiptImage.addEventListener("change", e => {
	const file = e.target.files[0]

	if (!file) {
		alert("No image selected")
	} else {
		const reader = new FileReader()

		reader.onload = function (e) {
			imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="preview-image" />`
		}
		reader.readAsDataURL(file)
	}
})

paymentButton.addEventListener("click", async () => {
	const details = JSON.parse(window.localStorage.getItem("payper"))

	paymentButton.classList.add("loading")
	const paymentDetails = details.paymentDetails ?? []
	const data = await paymentDetails.reduce((prev, currentValue) => {
		return { ...prev, [currentValue.field]: currentValue.value }
	}, {})

	if (!data.bank_code) {
		alert("No bank code, upload another image")
		window.location.reload()
		return
	}

	if (!Number(data.amount_to_be_paid)) {
		alert("No amount, upload another image")
		window.location.reload()
		return
	}

	try {
		await fetch("/pay", {
			method: "POST",
			body: JSON.stringify(data),
			headers: {
				accepts: "application/json",
				"content-type": "application/json",
			},
		})
			.then(res => res.json())
			.then(data => {
				if (data.success) {
					window.localStorage.removeItem("payper")
					alert("Payment successful")
					window.location.reload()
				}
			})
	} catch (e) {
		alert("Something went wrong while trying to make payment")
		console.error(e)
		paymentButton.classList.remove("loading")
	}
})

submitButton.addEventListener("click", async e => {
	e.preventDefault()

	submitButton.classList.add("loading")
	// Ensure stale data is not in local storage
	window.localStorage.removeItem("payper")
	const form = new FormData()
	const receiptImage = document.querySelector("#image")
	form.append("image", receiptImage.files[0], receiptImage.files[0].name)

	try {
		await fetch("/analyze", {
			method: "POST",
			body: form,
		})
			.then(res => res.json())
			.then(data => {
				if (data.data) {
					const info = data.data

					// Save data in storage
					window.localStorage.setItem("payper", JSON.stringify(info))

					const paymentDetails = info.paymentDetails ?? []
					const detailsMarkup = paymentDetails
						.map(detail => {
							return `<li><span class="payment-field">${detail.field.replaceAll(
								"_",
								" "
							)}</span>: <b>${detail.value}</b></li>`
						})
						.join("")

					infoArea.innerHTML = `<ul>${detailsMarkup}</ul>`
					submitButton.style.display = "none"
					paymentButton.style.display = "block"
				}
			})
	} catch (e) {
		console.error({ e })
	}
})

const supportedBanks = [
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
		id: 25,
		name: "Providus Bank",
		slug: "providus-bank",
		code: "101",
		longcode: "",
		gateway: null,
		pay_with_bank: false,
		supports_transfer: true,
		active: true,
		country: "Nigeria",
		currency: "NGN",
		type: "nuban",
		is_deleted: false,
		createdAt: "2017-03-27T16:09:29.000Z",
		updatedAt: "2021-02-09T17:50:06.000Z",
	},
]
