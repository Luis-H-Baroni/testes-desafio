const {
	FileSystemWallet,
	Wallet,
	Wallets,
	Gateway,
	X509WalletMixin,
} = require("fabric-network")
const fs = require("fs")
const path = require("path")
const FabricCAServices = require("fabric-ca-client")

// capture network variables from config.json
const configPath = path.join(process.cwd(), "config.json")
const configJSON = fs.readFileSync(configPath, "utf8")
const config = JSON.parse(configJSON)
let connection_file = config.connection_file
let appAdmin = config.appAdmin
let orgMSPID = config.orgMSPID
let gatewayDiscovery = config.gatewayDiscovery
let caName = config.caName

const ccpPath = path.join(process.cwd(), connection_file)
const ccpJSON = fs.readFileSync(ccpPath, "utf8")
const ccp = JSON.parse(ccpJSON)

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = {
	registrar: async (usuarioID, hash) => {
		const walletPath = path.join(process.cwd(), "/wallet")
		const wallet = await Wallets.newFileSystemWallet(walletPath)
		console.log(`Wallet path: ${walletPath}`)

		try {
			// Create a new gateway for connecting to our peer node.
			/* const gateway = new Gateway()
			await gateway.connect(ccp, {
				wallet,
				identity: appAdmin,
				discovery: gatewayDiscovery,
			}) */
			const caURL = ccp.certificateAuthorities[caName].url
			const ca = new FabricCAServices(caURL)

			const adminIdentity = await wallet.get("admin")
			// Get the CA client object from the gateway for interacting with the CA.
			/* const ca = gateway.getClient().getCertificateAuthority() */
			/* const adminIdentity = gateway.getCurrentIdentity() */
			const provider = wallet
				.getProviderRegistry()
				.getProvider(adminIdentity.type)
			const adminUser = await provider.getUserContext(adminIdentity, "admin")

			// Register the user, enroll the user, and import the new identity into the wallet.
			const secret = await ca.register(
				{
					affiliation: "org1.department1",
					enrollmentID: usuarioID,
					role: "client",
				},
				adminUser
			)
			const enrollment = await ca.enroll({
				enrollmentID: usuarioID,
				enrollmentSecret: secret,
			})
			/* const userIdentity = X509WalletMixin.createIdentity(
				orgMSPID,
				enrollment.certificate,
				enrollment.key.toBytes()
			) */
			const x509Identity = {
				credentials: {
					certificate: enrollment.certificate,
					privateKey: enrollment.key.toBytes(),
				},
				mspId: "Org1MSP",
				type: "X.509",
			}
			wallet.put(usuarioID, x509Identity)
			console.log(
				"Successfully registered and enrolled admin user " +
					usuarioID +
					" and imported it into the wallet"
			)

			// Disconnect from the gateway.
			//await gateway.disconnect()
			console.log("admin user admin disconnected")
		} catch (err) {
			//print and return error
			console.log(err)
			let error = {}
			error.error = err.message
			return error
		}

		await sleep(2000)

		try {
			// Create a new gateway for connecting to our peer node.
			const gateway2 = new Gateway()
			await gateway2.connect(ccp, {
				wallet,
				identity: usuarioID,
				discovery: gatewayDiscovery,
			})

			// Get the network (channel) our contract is deployed to.
			const network = await gateway2.getNetwork("mychannel")

			// Get the contract from the network.
			const contract = network.getContract("smart-contract")

			/* let colaborador = {}
			colaborador.usuarioID = usuarioID
			colaborador.hash = hash */

			// Submit the specified transaction.
			console.log("\nSubmit Create Member transaction.")
			//const createMemberResponse =
			await contract.submitTransaction("createUsuario", usuarioID, hash)
			//console.log("createMemberResponse: ")
			//console.log(JSON.parse(createMemberResponse.toString()))

			/* console.log("\nGet member state ")
			const memberResponse = await contract.evaluateTransaction(
				"GetState",
				usuarioID
			)
			console.log("memberResponse.parse_response: ")
			console.log(JSON.parse(memberResponse.toString())) */

			// Disconnect from the gateway.
			await gateway2.disconnect()

			return true
		} catch (err) {
			//print and return error
			console.log(err)
			let error = {}
			error.error = err.message
			return error
		}
	},
}
