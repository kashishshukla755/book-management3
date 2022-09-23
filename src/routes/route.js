const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const bookController = require("../controllers/bookController");
const reviewController = require("../controllers/reviewController");
const userAuth=require("../middleware/auth")

router.use("/books",userAuth.authenticate)

router.get("/test-me", function (req, res) {
	res.send("test api");
});

router.post("/register", userController.createUser);
router.post("/login", userController.userLogin);
router.post("/books",userAuth.authorization, bookController.createBook);
router.get("/books", bookController.getbooks);
router.get("/books/:bookId", bookController.booksbyparam);
router.delete("/books/:bookId",userAuth.authorization1, bookController.deletebook);
router.post("/books/:bookId/review", reviewController.createReview);
router.put("/books/:bookId/review/:reviewId",reviewController.putApi)


module.exports = router;
