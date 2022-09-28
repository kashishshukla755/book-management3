const Review = require("../models/reviewModel");
const Book = require("../models/bookModel");
const ObjectId = require("mongoose").Types.ObjectId;

const isValidString = function (data) {
	if (typeof data !== "string" || data.trim().length === 0) return false;
	return true;
};

const createReview = async function (req, res) {
	try {
		const paramsBookId = req.params.bookId;
		if (!paramsBookId)
			return res.status(400).send({ status: false, message: "Please provide bookId in url" });
		if (!ObjectId.isValid(paramsBookId))
			return res.status(400).send({ status: false, message: "Invalid bookId in url" });

		const reviewData = req.body;
		const bookExists = await Book.findOne({isDeleted: false,_id: reviewData.bookId,}).lean();
		if (!bookExists)
			return res.status(404).send({ status: false, message: "Book not found" });

		if (Object.keys(reviewData).length === 0)
			return res.status(400).send({ status: false, message: "Please give data" });

		const acceptedFields = ["bookId","reviewedBy","reviewedAt","rating","review",];
		for (key in req.body) {
			if (!acceptedFields.includes(key)) {
				return res.status(400).send({status: false,message: `Fields can be among these: ${acceptedFields.join(", ")}`,});
			}
		}

		const requiredFields = ["reviewedAt", "rating"];
		for (field of requiredFields) {
			if (!reviewData[field])
				return res.status(400).send({ status: false, message: `Please provide ${field}` });
		}
		if (!ObjectId.isValid(reviewData.bookId))
			return res.status(400).send({ status: false, message: "Invalid bookId" });

		if (paramsBookId !== reviewData.bookId)
			return res.status(400).send({status: false,message: "Book IDs are not matching. Please check Book ID",});

		const reviewedAtRegex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
		if (!reviewedAtRegex.test(reviewData.reviewedAt))
			return res.status(400).send({status: false,message: "Date should be in YYYY-MM-DD format and a valid date",});

		if (reviewData.reviewedBy) {
			if (!isValidString(reviewData.reviewedBy))
				return res.status(400).send({ status: false, message: "Invalid input in reviewedBy" });
		}

		if (reviewData.review) {
			if (!isValidString(reviewData.review))
				return res.status(400).send({ status: false, message: "Invalid input in review" });
		}

		if (typeof reviewData.rating === "number") {
			if (reviewData.rating >= 5 || 1 >= reviewData.rating) {
				return res.status(400).send({ status: false, message: "Ratings  be between 1 to 5" });
			} else if (reviewData.rating % 1 !== 0)
				return res.status(400).send({status: false,message: "Ratings shouldn't contain decimals",});
		} else {
			return res.status(400).send({ status: false, message: "Ratings should be in number" });
		}

		reviewData.reviewedAt = new Date();
		const createNewReview = await Review.create(reviewData);
		const updateBookReview = await Book.findByIdAndUpdate(
			reviewData.bookId,
			{ $inc: { reviews: 1 } },{ new: true }).lean().select({ __v: 0 }); //.lean() function converts BSON type object to normal JS object
		updateBookReview.reviewData = createNewReview;
		return res.status(201).send({ status: false, message: "Success", data: updateBookReview });
	} catch (error) {
		res.status(500).send({ status: false, message: error.message });
	}
};

const updateReview = async function (req, res) {
	try {
		let { bookId, reviewId } = req.params;
		if (!bookId && !reviewId)
			return res.status(400).send({ status: false, message: "Please provide proper id" });

		for (key of Object.keys(req.params))
			if (!ObjectId.isValid(key))
				return res.status(400).send({ status: false, message: `Invalid ${key}` });

		let findBook = await Book.findOne({ _id: bookId, isDeleted: false }).select({ ISBN: 0, __v: 0 }).lean();
		if (!findBook) {
			return res.status(404).send({ status: false, message: "Book not found" });
		}

		let findreviewId = await Review.findOne({_id: reviewId,isDeleted: false,});
		if (!findreviewId) {
			return res.status(404).send({ status: false, message: "Review not found" });
		}

		if (Object.keys(req.body).length === 0) {
			return res.status(404).send({ status: false, message: "request body can't be empty" });
		}

		const acceptedFields = ["reviewedBy", "rating", "review"];
		for (key in req.body) {
			if (!acceptedFields.includes(key)) {
				return res.status(400).send({status: false,message: `Fields can be among these: ${acceptedFields.join(", ")}`,});}
		}

		let { reviewedBy, rating, review } = req.body;

		obj = { reviewedAt: new Date() };
		if (reviewedBy) {
			if (!isValidString(reviewedBy))
				return res.status(400).send({ status: false, message: "Invalid person name" });
			obj.reviewedBy = reviewedBy;
		}

		if (rating) {
			if (typeof rating === "number") {
				if (rating > 5 || 1 > rating) {
					return res.status(400).send({status: false,message: "Ratings should be between 1 to 5",});
				} else if (rating % 1 !== 0)
					return res.status(400).send({status: false,message: "Ratings shouldn't contain decimals",});
			} else {
				return res.status(400).send({ status: false, message: "Ratings should be in number" });
			}
			obj.rating = rating;
		}

		if (review) {
			if (!isValidString(review))
				return res.status(400).send({ status: false, message: "Invalid review" });
			obj.review = review;
		}

		let updatedReview = await Review.updateOne({ _id: reviewId }, obj);

		const reviewsData = await Review.find({ bookId });
		findBook.reviewsData = reviewsData;

		return res.status(200).send({ status: true, message: "Success", data: findBook });
	} catch (err) {
		res.status(500).send({ status: false, message: err.message });
	}
};

const deleteReview = async function (req, res) {
	try {
		const requiredFields = ["bookId", "reviewId"];

		for (field of requiredFields) {
			if (!req.params.hasOwnProperty(field))
				return res
					.status(400)
					.send({ status: false, message: `${field} is missing` });
		}
		for (field of requiredFields) {
			if (!ObjectId.isValid(req.params[field]))
				return res
					.status(400)
					.send({ status: false, message: `${field} is invalid objectId` });
		}

		let { bookId, reviewId } = req.params;

		const isBookPresent = await Book.findOne({ _id: bookId, isDeleted: false });
		if (!isBookPresent)
			return res.status(404).send({ status: false, message: "No book found" });
		const isReviewPresent = await Review.findOne({
			_id: reviewId,
			isDeleted: false,
		});
		if (!isReviewPresent)
			return res
				.status(404)
				.send({ status: false, message: "No review found" });

		if (bookId !== isReviewPresent.bookId.toString())
			return res.status(400).send({
				status: false,
				message: "The review is not present for the given book",
			});

		const deleteReview = await Review.findByIdAndUpdate(reviewId, {
			isDeleted: true,
		});
		const updateBook = await Book.findOneAndUpdate(
			{ _id: bookId, isDeleted: false },
			{ $inc: { reviews: -1 } },
			{ new: true }
		).lean();
		const reviews = await Review.find({ bookId, isDeleted: false });
		updateBook.reviewsData = reviews;
		res
			.status(200)
			.send({ status: true, message: "Success", data: updateBook });
	} catch (err) {
		res.status(500).send({ status: false, message: err.message });
	}
};

module.exports = { createReview, updateReview, deleteReview };


