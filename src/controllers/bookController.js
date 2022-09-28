const Book = require("../models/bookModel");
const Review = require("../models/reviewModel");
const ObjectId = require("mongoose").Types.ObjectId;

const isValidString = function (data) {
	if (typeof data !== "string" || data.trim().length === 0) return false;
	return true;
};

const createBook = async function (req, res) {
	try {
		const data = req.body;

		if (Object.keys(data).length === 0)
			return res
				.status(400)
				.send({ status: false, message: "Please Provide Data" });

		const requiredFields = ["title", "excerpt", "userId", "ISBN", "category", "subcategory", "releasedAt",];

		const acceptedFields = ["title", "excerpt", "userId", "ISBN", "category", "subcategory", "reviews", "deletedAt", "isDeleted", "releasedAt",];

		for (key in req.body) {
			if (!acceptedFields.includes(key))
				return res.status(400).send({ status: false, message: `Fields can only be among these: ${acceptedFields.join(", ")}`, });
		}

		for (field of requiredFields) {
			if (!data[field])
				return res.status(400).send({ status: false, message: `${field} is missing.` });
		}

		for (field of requiredFields) {
			if (!isValidString(data[field]))
				return res.status(400).send({ status: false, message: `${field} must contain characters.`, });
		}

		const ISBNregex =
			/^(?:ISBN(?:-13)?:?\ )?(?=[0-9]{13}$|(?=(?:[0-9]+[-\ ]){4})[-\ 0-9]{17}$)97[89][-\ ]?[0-9]{1,5}[-\ ]?[0-9]+[-\ ]?[0-9]+[-\ ]?[0-9]$/;
		if (!ISBNregex.test(data.ISBN))
			return res.status(400).send({ status: false, message: "Invalid ISBN" });

		if (data.reviews) {
			if (typeof data.reviews !== "number")
				return res.status(400).send({ status: false, message: "Reviews type invalid, should be in number.", });

			if (data.reviews % 1 !== 0)
				return res.status(400).send({ status: false, message: "Reviews can't be in decimals." });
		}

		const releasedAtRegex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
		if (!releasedAtRegex.test(data.releasedAt))
			return res.status(400).send({ status: false, message: "Date should be in YYYY-MM-DD format and a valid date", });

		if (!ObjectId.isValid(data.userId))
			return res.status(400).send({ status: false, message: "Invalid ObjectId:UserId" });

		const uniqueFields = ["title", "ISBN"];
		for (field of uniqueFields) {
			const empObj = {};
			empObj[field] = data[field];
			const checkUnique = await Book.findOne(empObj);
			if (checkUnique)
				return res.status(400).send({ status: false, message: `${field} already present. Please provide an unique ${field}`, });
		}

		const newBook = await Book.create(data);
		res.status(201).send({ status: true, message: "Success", data: newBook });
	} catch (error) {
		res.status(500).send({ status: false, message: error.message });
	}
};

const getBooks = async function (req, res) {
	try {
		for (keys of Object.keys(req.query)) {
			if (req.query[keys].length === 0)
				return res.status(400).send({ status: false, msg: `Please provide ${keys}` });
		}

		const queryArray = ["userId", "category", "subcategory"];
		for (key in req.query) {
			if (!queryArray.includes(key))
				return res.status(400).send({ status: false, msg: `Query parameters can only be among these: ${queryArray.join(", ")}`, });
		}

		let { userId, category, subcategory } = req.query;

		let obj = { isDeleted: false };

		if (userId) {
			if (!ObjectId.isValid(userId) || userId.trim().length === 0)
				return res.send({ status: false, message: "Invalid userId" });
			obj.userId = userId;
		}
		if (category) {
			obj.category = category;
		}
		if (subcategory) {
			obj.subcategory = subcategory;
		}

		let findbook = await Book.find(obj).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 })
			.sort({ title: 1 });
		if (findbook.length === 0) {
			return res.status(404).send({ status: false, message: "No books found" });
		}

		return res.status(200).send({ status: true, message: "Success", data: findbook });
	} catch (err) {
		return res.status(500).send({ status: false, message: "Error", error: err.message });
	}
};

const booksByParam = async function (req, res) {
	try {
		let bookId = req.params.bookId;
		if (!bookId) {
			return res.status(400).send({ status: false, message: "bookId is mandatory" });
		}

		if (!ObjectId.isValid(bookId)) {
			return res.status(400).send({ status: false, msg: "Please enter correct bookId" });
		}

		let findBook = await Book.findOne({ _id: bookId, isDeleted: false }).select({ ISBN: 0, __v: 0 }).lean();
		if (!findBook) {
			return res.status(404).send({ status: false, message: "Book not found" });
		}
		const reviewsData = await Review.find({ bookId, isDeleted: false });
		findBook.reviewsData = reviewsData;

		return res.status(200).send({ status: true, message: "Success", data: findBook });
	} catch (err) {
		return res.status(500).send({ status: false, message: "Error", error: err.message });
	}
};

const updateBooks = async function (req, res) {
	try {
		let bookId = req.params.bookId;

		if (Object.keys(req.body).length === 0)
			return res.status(400).send({ status: false, message: "Please provide data in the body" });

		let findBook = await Book.findById(bookId);
		if (!findBook) {
			return res.status(404).send("book doesn't exists");
		}

		let bookData = req.body;
		const { title, excerpt, ISBN, releasedAt } = bookData;
		
		const releaseDate = bookData["release date"];

		const updateFields = ["title", "excerpt", "release date", "ISBN", "releasedAt",];

		for (key in bookData) {
			if (!updateFields.includes(key))
				return res.status(400).send({ status: false, message: `Updation fields can be only among these: ${updateFields.join(", ")}`, });
		}

		for (key of Object.keys(req.body)) {
			if (!isValidString(req.body[key]))
				return res.status(400).send({ status: false, message: `Invalid ${key} format` });
		}

		if (title) {
			let isTitlePresent = await Book.findOne({ title: title });
			if (isTitlePresent)
				return res.status(400).send({ status: false, message: "Title already present" });
		}
		if (ISBN) {
			let isISBNPresent = await Book.findOne({ ISBN: ISBN });
			if (isISBNPresent)
				return res.status(400).send({ status: false, message: "ISBN is already present" });
		}

		if (excerpt) {
			if (!isValidString(excerpt))
				return res.status(400).send({ status: false, message: "Invalid excerpt format" });
		}

		if (releasedAt) {
			const releasedAtRegex =
				/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
			if (!releasedAtRegex.test(releasedAt))
				return res.status(400).send({ status: false, message: "Date should be in YYYY-MM-DD format and a valid date", });
		}
		if (releaseDate) {
			const releasedAtRegex =
				/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
			if (!releasedAtRegex.test(releaseDate))
				return res.status(400).send({ status: false, message: "Date should be in YYYY-MM-DD format and a valid date", });
			bookData.releasedAt = releaseDate;
			delete bookData["release date"];
		}

		let updatedBook = await Book.findOneAndUpdate({ _id: bookId, isDeleted: false }, bookData, { new: true, });

		res.status(201).send({ status: true, data: updatedBook });
	} catch (err) {
		res.status(500).send({ msg: err.message });
	}
};

const deleteBook = async function (req, res) {
	try {
		let bookId = req.params.bookId;

		let markdelete = await Book.findOneAndUpdate({ _id: bookId, isDeleted: false }, { isDeleted: true, deletedAt: new Date() });
		res.status(200).send({ status: true, message: "Book successfully deleted" });
	} catch (err) {
		res.status(500).send({ status: false, message: "Error", error: err.message });
	}
};

module.exports = { createBook, getBooks, booksByParam, deleteBook, updateBooks, };