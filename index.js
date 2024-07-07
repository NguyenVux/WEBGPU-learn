const express = require("express");

const app = express()
const port = 80

app.use("/",express.static("static"))
app.use("/dist",express.static("dist"))

app.listen(port,()=>{
	console.log(`listen on port ${port}`)
})