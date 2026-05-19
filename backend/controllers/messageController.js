const mongoose = require("mongoose");
const Message = require("../models/Message");

exports.getMessages = async (req, res) => {
    try {
        const user1 = req.user._id;
        const { user2, groupId } = req.query;

        let messages;

        if (groupId) {
            if (!mongoose.Types.ObjectId.isValid(groupId)) {
                return res.status(400).json({ error: "Неправильний ідентифікатор групи" });
            }
            messages = await Message.find({ groupId })
                .populate("senderId", "username fullName avatar")
                .sort({ createdAt: 1 });
        } else if (user2) {
            if (!mongoose.Types.ObjectId.isValid(user2)) {
                return res.status(400).json({ error: "Неправильний ідентифікатор користувача" });
            }
            messages = await Message.find({
                $or: [
                    { senderId: user1, receiverId: new mongoose.Types.ObjectId(user2) },
                    { senderId: new mongoose.Types.ObjectId(user2), receiverId: user1 },
                ],
            })
                .populate("senderId", "username fullName avatar")
                .sort({ createdAt: 1 });
        } else {
            return res.status(400).json({ error: "Вкажіть user2 або groupId" });
        }

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка сервера" });
    }
};

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Зображення не завантажено' });
        }
        res.status(200).json({
            success: true,
            imageUrl: req.file.filename
        });
    } catch (err) {
        console.error('Error uploading message image:', err);
        res.status(500).json({ success: false, message: 'Помилка завантаження зображення' });
    }
};

exports.editMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const { text } = req.body;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Повідомлення не знайдено' });
        }

        if (message.senderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Ви не маєте дозволу редагувати це повідомлення' });
        }

        message.text = text;
        message.isEdited = true;
        await message.save();

        res.status(200).json({ success: true, data: message });
    } catch (err) {
        console.error('Error editing message:', err);
        res.status(500).json({ success: false, message: 'Помилка редагування повідомлення' });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Повідомлення не знайдено' });
        }

        if (message.senderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Ви не маєте дозволу видаляти це повідомлення' });
        }

        await Message.findByIdAndDelete(messageId);

        res.status(200).json({ success: true, message: 'Повідомлення видалено' });
    } catch (err) {
        console.error('Error deleting message:', err);
        res.status(500).json({ success: false, message: 'Помилка видалення повідомлення' });
    }
};
