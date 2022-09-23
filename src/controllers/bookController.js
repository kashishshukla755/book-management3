const Book = require("../models/bookModel");
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
		}

		const releasedAtRegex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
		if (!releasedAtRegex.test(data.releasedAt))
			return res.status(400).send({ status: false, message: "Invalid Release Date" });

		if (!ObjectId.isValid(data.userId))
			return res.status(400).send({ status: false, message: "Invalid ObjectId:UserId" });

		const uniqueFields = ["title", "ISBN"];
		for (field of uniqueFields) {
			const empObj = {};
			empObj[field] = data[field];
			const checkUnique = await Book.findOne(empObj);
			if (checkUnique)
				return res.status(400).send({
					status: false,
					message: `${field} already present. Please provide an unique ${field}`,
				});
		}

		const newBook = await Book.create(data);
		res.status(201).send({ status: true, message: "Success", data: newBook });
	} catch (error) {
		res.status(500).send({ status: false, message: error.message });
	}
};

//--------------------update/put book-------------------//

const updateBooks = async function (req, res) {
	try {
	  let bookId = req.params.bookId;
	  
	  let books = await Book.findById(bookId);
	  if (!books) {
		return res.status(404).send("book doesn't exists");
	  }
	
	  let bookData = req.body;
	  const { title, excerpt, ISBN, releasedate } = bookData;
	  if(title){
		let isTitlePresent=await Book.find({title:title})
		if(Object.keys(isTitlePresent).length !== 0) return res.status(400).send({status:false,message:"Title already present"})
	  }
	  if(ISBN){
		let isISBNPresent=await Book.find({ISBN:ISBN})
		if(Object.keys(isISBNPresent).length !== 0) return res.status(400).send({status:false,message:"ISBN is already present"})
	  }
  
	  let updateBook = await Book.findOneAndUpdate(
		{ _id: bookId }, { title: title, excerpt: excerpt, ISBN: ISBN, releasedate: new Date() },{new: true });
	  res.status(201).send({ status: true, data: updateBook });
	} catch (err) {
	  res.status(500).send({ msg: err.message });
	}
  };
//...................................getbooks........................................................

const getbooks = async function (req, res) {
	try {
		let obj = { isDeleted: false };

		// let userId = req.query.userId;
		// let category = req.query.category;
		// let subcategory = req.query.subcategory;

		let { userId, category, subcategory } = req.query

		if (userId) {
			obj.userId = userId;
		}
		if (category) {
			obj.category = category;
		}
		if (subcategory) {
			obj.subcategory = subcategory;
		}

		let findbook = await Book.find(obj).select({_id: 1,title: 1,excerpt: 1,userId: 1,category: 1,reviews: 1,releasedAt: 1,})
			.sort({ title: 1 });
		if (findbook.length == 0) {
			return res.status(404).send({ status: false, message: "book not found" });
		}
		return res
			.status(200)
			.send({ status: true, message: "Success", data: findbook });
	} catch (err) {
		return res
			.status(500)
			.send({ status: false, message: "Error", error: err.message });
	}
};

const booksbyparam = async function (req, res) {
	try {
		let bookId = req.params.bookId;

		if (!bookId) {
			return res.status(400).send({ status: false, message: "bookId is mendatory" });
		}

		let findbookId = await Book.findOne({ _id: bookId, isDeleted: false });
		if (!findbookId) {
			return res.status(404).send({ status: false, message: "book not found" });
		}

		return res.status(200).send({ status: true, message: "Success", data: findbookId });
	} catch (err) {
		return res.status(500).send({ status: false, message: "Error", error: err.message });
	}
};

// ### DELETE /books/:bookId
// - Check if the bookId exists and is not deleted. If it does, mark it deleted and return an HTTP status 200 with a response body with status and message.
// - If the book document doesn't exist then return an HTTP status of 404 with a body like [this](#error-response-structure)

const deletebook = async function (req, res) {
	try {
		
		let bookId = req.params.bookId;
		if (!bookId) {
			return res.status(400).send({ status: false, message: "bookId is mendatory" });
		}

		let findbook = await Book.findById(bookId)
		if (!findbook) {
			return res.status(404).send("blog document doesn't exist");
		}

		let data = findbook.isDeleted
		if (data == true) {
			return res.status(404).send("blog document already deleted");
		}

		let markdelete = await Book.updateOne({ _id: bookId }, { isDeleted: true ,deletedAt:new Date}, { new: true })
		res.status(200).send({ status: true, message: "success" })
	} catch (err) {
		res.status(500).send({ status: false, message: "Error", error: err.message });
	}
}

module.exports = { createBook, getbooks, booksbyparam, deletebook,updateBooks };
