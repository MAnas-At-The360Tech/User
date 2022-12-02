import joi from 'joi';
import { refreshToken, User } from '../models'
import CustomErrorHandler from '../services/CustomErrorHandler';
import bcrypt from 'bcrypt';
import JwtService from '../services/JwtService'
import { REFRESH_SECRET } from '../Config'

const UserController = {
    async signIn(req, res, next) {

        //requsd body validation
        const signInSchama = joi.object({
            name: joi.string().min(3).max(50).required(),
            email: joi.string().email().required(),
            password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required()
        })

        const { error } = signInSchama.validate(req.body)

        if (error) {
            return next(error)
        }

        // check if user is in the database alseady 
        const { name, email, password } = req.body
        try {
            const exist = await User.exists({ email })
            if (exist) {
                return next(CustomErrorHandler.alreadyExist('This email is already Exist.'))
            }
        } catch (error) {
            return next(err)
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // propare the model
        const user = new User({
            name,
            email,
            password: hashedPassword
        })

        try {
            // store in database
            const result = await user.save()

            // Token Create
            let access_token = JwtService.sign({ _id: result._id, role: result.role })
            let refresh_token = JwtService.sign({ _id: result._id, role: result.role }, '1y', REFRESH_SECRET)

            // save refresh_token token
            await refreshToken.create({ token: refresh_token })

            // res.json(result)
            res.json({ access_token, refresh_token })
        } catch (error) {
            return next(err);
        }
    },
    async refresh(req, res, next) {
        // validation
        const refreshSchema = joi.object({
            refresh_token: joi.string().required()
        });

        const { error } = refreshSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        try {
            // Chack Token in database
            let refreshtoken = await refreshToken.findOne({ token: req.body.refresh_token })
            if (!refreshtoken) {
                return next(CustomErrorHandler.unAuthorized('Invalid refreh token'))
            }

            // separate user id
            let userId;
            try {
                const { _id } = await JwtService.verify(refreshtoken.token, REFRESH_SECRET);
                userId = _id;
            } catch (err) {
                return next(CustomErrorHandler.unAuthorized('Invalid refreh token'))
            }

            // find user in database 
            const user = User.findOne({ _id: userId });
            if (!user) {
                return next(CustomErrorHandler.unAuthorized('No user fond!'))
            }

            // create Token
            const access_token = JwtService.sign({ _id: user._id, role: user.role })

            res.json({ access_token });

        } catch (error) {
            return next(error);
        }
    },
    async login(req, res, next) {
        // validation
        const loginSchema = joi.object({
            email: joi.string().email().required(),
            password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
        });

        const { error } = loginSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        try {
            // chack user in database
            const user = await User.findOne({ email: req.body.email });

            if (!user) {
                return next(CustomErrorHandler.wrongCredentials());
            }

            // compare the password
            const match = await bcrypt.compare(req.body.password, user.password)

            if (!match) {
                return next(CustomErrorHandler.wrongCredentials());
            }

            // Token
            const access_token = JwtService.sign({ _id: user._id, role: user.role })
            const refresh_token = JwtService.sign({ _id: user._id, role: user.role }, '1y', REFRESH_SECRET)
            // database whitelist

            await refreshToken.create({ token: refresh_token })
            res.json({ access_token, refresh_token });
        } catch (err) {
            return next(err)
        }
    },
    async logout(req, res, next) {
        // validation
        const refreshSchema = joi.object({
            refresh_token: joi.string().required()
        });

        const { error } = refreshSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        try {
            // dalete on database
            await refreshToken.deleteOne({ token: req.body.refresh_token })
        } catch (err) {
            return next(new Error('Something went wrong in database'))
        }
        res.json({ status: 1 });
    }
}

export default UserController