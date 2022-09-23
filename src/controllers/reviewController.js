const Review = require("../models/reviewModel")
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
		if (Object.keys(reviewData).length === 0)
			return res.status(400).send({ status: false, message: "Please give data" });

		const requiredFields = ["bookId", "reviewedAt", "rating"];
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
			return res.status(400).send({status: false,message: "Date should be in YYYY-MM-DD format",});

		if (reviewData.reviewedBy) {
			if (!isValidString(reviewData.reviewedBy))
				return res.status(400).send({ status: false, message: "Invalid input in reviewedBy" });
		}

		if (reviewData.review) {
			if (!isValidString(reviewData.review))
				return res.status(400).send({ status: false, message: "Invalid input in review" });
		}

		if (typeof reviewData.rating === "number") {
			if (reviewData.rating > 5 || 1 > reviewData.rating){
                return res.status(400).send({ status: false, message: "Ratings  be between 1 to 5" });
            }
          else if(reviewData.rating%1 !== 0) return res.status(400).send({status:false,message:"Ratings shouldn't contain decimals"})
		} else
			{return res.status(400).send({ status: false, message: "Ratings should be in number" });}

		const bookExists = await Book.findOne({isDeleted: false,_id: reviewData.bookId,}).lean();
		if (!bookExists)
			return res.status(404).send({ status: false, message: "Book not found" });

		reviewData.reviewedAt = new Date();
		const createNewReview = await Review.create(reviewData);
		const updateBookReview = await Book.findByIdAndUpdate(
			reviewData.bookId,
			{ $inc: { reviews: 1 } },
			{ new: true }
		).lean();
		updateBookReview.reviewData = createNewReview;
		return res.status(201).send({ status: false, message: "Success", data: updateBookReview });
	} catch (error) {
		res.status(500).send({ status: false, message: error.message });
	}
};


const putApi = async function (req, res) {
    try {
        let { bookId, reviewId } = req.params
        let findbookid = await Book.findById({ _id: bookId, isDeleted: false })
        if (!findbookid) {
            return res.status(404).send({ status: false, message: "book not found" })
        }
        let findreviewId = await Review.findById(reviewId)
        if (!findreviewId) {
            return res.status(404).send({ status: false, message: "review not found" })
        }

        let { reviewedBy, rating, review } = req.body
        if (!req.body) {
            return res.status(404).send({ status: false, message: "request body can't be empty" })
        }


        let obj = {}
        if (userId) {
            obj.reviewedBy = reviewedBy;
        }
        if (rating) {
            obj.rating = rating;
        }
        if (review) {
            obj.review = review;
        }
        obj = { reviewedAt: new Date() }

        let markdelete = await Review.updateOne({ _id: reviewId }, obj, { new: true })
        return res.status(200).send({ status: true, message: "Success", data: markdelete });

    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
}

module.exports = {createReview, putApi }

