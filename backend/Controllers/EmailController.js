import joi from 'joi';
import { User } from '../models'
import CustomErrorHandler from '../services/CustomErrorHandler';
import JwtService from '../services/JwtService'
import { JWT_SECRET } from '../Config'
const nodemailer = require('nodemailer');

const UserController = {
    async refresh(req, res, next) {
        // validation
        const refreshSchema = joi.object({
            access_token: joi.string().required()
        });

        const { error } = refreshSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        try {
            // separate user id
            let userId;
            try {
                const { _id } = await JwtService.verify(req.body.refresh_token, JWT_SECRET);
                userId = _id;
            } catch (err) {
                return next(CustomErrorHandler.unAuthorized('Invalid refreh token'))
            }

            let code = getRandomInt(1000, 9999)

            // find user in database 
            const user = User.findOneAndUpdate({ _id: userId }, {
                email_code: code
            }, { new: true });

            if (!user) {
                return next(CustomErrorHandler.unAuthorized('No user fond!'))
            }

            // For Gmail
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'm.anas.the360tech@gmail.com',
                    pass: 'gugoqdbonfvpvesy'
                }
            });

            let mailOptions = {
                from: "m.anaslatif@the360technologies.com",
                to: user.email,
                subject: 'Email Verification',
                text: `Hi ${user.name} your Verification code is  ${user.email_code}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    // console.log(error);
                    res.status(401).json({ Psot: "error" })
                }
            });

            res.json({ status: 1 });
        } catch (error) {
            return next(error);
        }
    },
}

const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

export default UserController