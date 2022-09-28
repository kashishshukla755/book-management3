const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const bookController = require("../controllers/bookController");
const reviewController = require("../controllers/reviewController");
const userAuth=require("../middleware/auth")


//User API
router.post("/register", userController.createUser);
router.post("/login", userController.userLogin);

//Book API
router.post(
	"/books",
	userAuth.authenticate,
	userAuth.authorizationFromBody,  
	bookController.createBook
);
router.get("/books", userAuth.authenticate, bookController.getBooks);
router.get(
	"/books/:bookId",
	userAuth.authenticate,

	bookController.booksByParam
);
router.put(
	"/books/:bookId",
	userAuth.authenticate,
	userAuth.authorizationFromParam,
	bookController.updateBooks
);
router.delete(
	"/books/:bookId",
	userAuth.authenticate,
	userAuth.authorizationFromParam,
	bookController.deleteBook
);

//Review API
router.post("/books/:bookId/review", reviewController.createReview);
router.put("/books/:bookId/review/:reviewId",reviewController.updateReview)
router.delete("/books/:bookId/review/:reviewId",reviewController.deleteReview)

module.exports = router;
