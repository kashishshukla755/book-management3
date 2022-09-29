const express = require("express");
const bodyParser = require("body-parser");
const route = require("./routes/route.js");
const { default: mongoose } = require("mongoose");
const app = express();
const multer= require("multer");
const { AppConfig } = require('aws-sdk');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use( multer().any())
mongoose
	.connect(
		"mongodb+srv://kumarsagar43:uc99rt0Ne2jXK974@cluster0.anfzbs2.mongodb.net/test",
		{
			useNewUrlParser: true,
		}
	)
	.then(() => console.log("MongoDB is connected"))
	.catch((err) => console.log(err));

app.use("/", route);

app.listen(process.env.port || 3000, function () {
	console.log("Express app running on port " + (process.env.port || 3000));
});
