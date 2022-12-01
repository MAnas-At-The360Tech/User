import joi from 'joi';
import { refreshToken, User } from '../../models'
import CustomErrorHandler from '../../services/CustomErrorHandler';
import bcrypt from 'bcrypt';
import JwtService from '../../services/JwtService'
import { REFRESH_SECRET } from '../../Config'

const signIn = {
    async adduser(req, res, next) {

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
    }
}

export default signIn