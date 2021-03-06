const express = require ('express');
const { check, validationResult } = require('express-validator')

const usersRepo = require('../../repositories/users');
const signupTemplate = require ('../../views/admin/auth/signup')
const signinTemplate = require ('../../views/admin/auth/signin')
const { requireEmail, requirePassword, requirePasswordConfirmation } = require('./validators')


const router = express.Router();

router.get('/signup', (req, res) => {
    res.send(signupTemplate({ req }));
});


router.post('/signup',
    [
        requireEmail,
        requirePassword,
        requirePasswordConfirmation
    ],

    async (req,res) => { 
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.send(signupTemplate({req, errors}));
    }

    const { email,password,passwordConfirmation} = req.body;
   

//create a user in our user repo to represent this person
const user = await usersRepo.create( {email,password});
//store the id of that userinsed the users cookie install cookie-session
    req.session.userID = user.id;
    res.send('Account created');
}); 

router.get('/signout', (req, res) => {
    req.session = null;
    res.send('You are logged out')
});
router.get('/signin', (req, res) => {
    res.send (signinTemplate());
});

router.post('/signin',[
    check('email')
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage('Must provide a valid email')
        .custom (async email => {
            const user = await usersRepo.getOneBy({ email})
            if (!user) {
            throw new Error('Email not found')
            }
        })
        ,
    check('password')
        .trim()
        .custom (async (password, { req }) => {
            const user = await usersRepo.getOneBy({ email: req.body.email});
            if (!user) {
                throw new Error('Invalid Password');
            }
            const validPassword = await usersRepo.comparePasswords (
                user.password,
                password
            )
            if (!validPassword) {
                 throw new Error('Invalid Password')
            }
        })
    ],
     async (req, res) => {
     const errors = validationResult(req);
     console.log(errors)
     const { email } = req.body;
     const user = await usersRepo.getOneBy({email});
     
     req.session.userID = user.id;
     
     res.send('You are signed in')
})

module.exports = router;