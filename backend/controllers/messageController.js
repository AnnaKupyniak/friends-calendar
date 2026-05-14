const mongoose = require("mongoose");
const Message = require("../models/Message");

exports.getMessages = async (req, res) => {
    try {
        const user1 = req.user._id;
        const { user2 } = req.query;

        console.log("user1 (logged in):", user1.toString());
        console.log("user2 (from query):", user2);
        if (!mongoose.Types.ObjectId.isValid(user2)) {
            return res.status(400).json({ error: "Invalid user id" });
        }

        const messages = await Message.find({
            $or: [
                { senderId: user1, receiverId: new mongoose.Types.ObjectId(user2) },
                { senderId: new mongoose.Types.ObjectId(user2), receiverId: user1 },
            ],
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};
