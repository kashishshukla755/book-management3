const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const bookSchema = new mongoose.Schema(
	{
		bookCover:{type: String, required: true},
		title: { type: String, required: true, unique: true, trim: true,lowercase:true },
		excerpt: { type: String, required: true, trim: true,lowercase:true },
		userId: { type: ObjectId, required: true, ref: "User", trim: true },
		ISBN: { type: String, required: true, unique: true, trim: true },
		category: { type: String, required: true, trim: true,lowercase:true },
		subcategory: { type: String, required: true, trim: true,lowercase:true },
		reviews: { type: Number, default: 0, trim: true },
		deletedAt: { type: Date, trim: true },
		isDeleted: { type: Boolean, default: false, trim: true },
		releasedAt: { type: Date, required: true, trim: true },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);
