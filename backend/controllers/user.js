const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const cryptoJS = require('crypto-js');
const passwordValidator = require('password-validator');

require('dotenv').config({path:'../.env'})

exports.signup = (req, res, next) => {
    const schema = new passwordValidator();
    schema
    .is().min(8)
    .is().max(100)
    .has().uppercase()
    .has().lowercase()
    .has().digits(2)
    .has().not().spaces()
    .is().not().oneOf(['Passw0rd', 'Password123', 'Motdepasse123']);
    if(!schema.validate(req.body.password)){res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères, 1 minuscule, 1 majuscule, 2 chiffres, pas d'espaces et maximum 100 caractères"});return;}
    if(!/\S+@\S+\.\S+/i.test(req.body.email)){res.status(400).json({ message: "L'adresse mail doit contenir un arobase et un point"});return;}
    bcrypt.hash(req.body.password, 10)
      .then(hash => {
        const emailCrypted = cryptoJS.SHA512(req.body.email,process.env.SECRET_EMAIL).toString();
        const user = new User({
          email: emailCrypted,
          password: hash
        });
        user.save()
          .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
          .catch(error => res.status(400).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
  };

  exports.login = (req, res, next) => {
    const emailCrypted = cryptoJS.SHA512(req.body.email,process.env.SECRET_EMAIL).toString();
    User.findOne({ email: emailCrypted })
      .then(user => {
        if (!user) {
          return res.status(401).json({ error: 'Utilisateur non trouvé !' });
        }
        bcrypt.compare(req.body.password, user.password)
          .then(valid => {
            if (!valid) {
              return res.status(401).json({ error: 'Mot de passe incorrect !' });
            }
            res.status(200).json({
              userId: user._id,
              token: jwt.sign(
                { userId: user._id },
                process.env.TOKEN,
                { expiresIn: '24h' }
              )
            });
          })
          .catch(error => res.status(500).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
  };