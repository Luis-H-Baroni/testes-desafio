const express = require("express")
//const { add } = require("nodemon/lib/rules")
//const connectDB = require("./db/connect")
require("dotenv").config()
//const usuarios = require("./routes/usuarioRoute")
const addNetwork = require("./addNetwork")
//inicia o express
const app = express()

//middleware
app.use(express.json())

//routes
//app.use("/usuario", usuarios)

app.post("/testes", (req, res) => {
	let usuarioID = req.body.usuarioID
	let hash = req.body.hash

	addNetwork.registrar(usuarioID, hash).then((response) => {
		//return error if error in response
		if (
			typeof response === "object" &&
			"error" in response &&
			response.error !== null
		) {
			res.json({
				error: response.error,
			})
		} else {
			//else return success
			res.json({
				success: response,
			})
		}
	})

	console.log(`usuarioID: ${usuarioID}, hash: ${hash} -`)
})
//port
const port = 3000

const start = async () => {
	try {
		//await connectDB(process.env.MONGO_URI)
		app.listen(3000, console.log(`servidor rodando na porta ${port}...`))
	} catch (error) {
		console.log(error)
	}
}

start()
