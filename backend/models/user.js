import mongoose from "mongoose";
const Schema = mongoose.Schema

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    email_status: { type: String, default: 'Not verified' },
    email_code: { type: Number, default: 1000 }
}, { timestamps: true })

export default mongoose.model('User', userSchema)