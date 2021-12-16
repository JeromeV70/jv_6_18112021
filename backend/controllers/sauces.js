const Thing = require('../models/Sauces');
const fs = require('fs');

exports.createThing = (req, res, next) => {
  const thingObject = JSON.parse(req.body.sauce);
  // l'id est généré automatiquement par la BDD
  delete thingObject._id;
  // initialisation des likes à 0
  thingObject.likes=0;
  thingObject.dislikes=0;
  // création de l'objet à insérer dans la BDD
  const thing = new Thing({
    ...thingObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  thing.save()
    .then(() => res.status(201).json({ message: 'Objet enregistré !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.getOneThing = (req, res, next) => {
    Thing.findOne({ _id: req.params.id})
      .then(thing => {
        // recherche de userId dans les likes ou dislike de la sauce ( -1 == pas d'occurence )
        const userLiked = thing.usersLiked.indexOf(req.auth.userId);
        const userDisliked = thing.usersDisliked.indexOf(req.auth.userId);
        // n'afficher que l'identifiant de l'utilisateur dans la liste des likes et dislikes, pour confidentialité.
        if (userLiked > -1){thing.usersLiked = [req.auth.userId]}
        else {thing.usersLiked = [];}
        if (userDisliked > -1){thing.usersDisliked = [req.auth.userId]}
        else {thing.usersDisliked = [];}
        res.status(200).json(thing);
      })
      .catch(error => res.status(400).json({ error }));
  }

exports.modifyThing = (req, res, next) => {

  let thingObject = {};
  // Si nouvelle image
  if(req.file){
    thingObject = {...JSON.parse(req.body.sauce),imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`};
    // recherche du lien de l'ancienne image pour suppression
    Thing.findOne({ _id: req.params.id})
      .then(thing => {
        const filename = thing.imageUrl.split('/images/')[1];
        // suppression de l'ancienne image
        fs.unlink(`images/${filename}`,(err)=>{if (err) throw err;})
      })
      .catch(error => res.status(400).json({ error }));
  }
  else{
    thingObject = { ...req.body };
  }
  Thing.updateOne({ _id: req.params.id }, { ...thingObject, _id: req.params.id })
  .then(() => res.status(200).json({ message: 'Objet modifié !'}))
  .catch(error => res.status(400).json({ error }));
};

exports.deleteThing = (req, res, next) => {
  Thing.findOne({ _id: req.params.id })
    .then(thing => {
      // si pas le bon ID, erreur
      if(thing.userId !== req.auth.userId){res.status(401).json({ message: 'Non autorisé !'});return;}
      const filename = thing.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Thing.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

exports.getAllThings = (req, res, next) => {
    Thing.find()
      .then(things => {
        things.forEach(function(thing){
          // recherche de userId dans les likes ou dislike de la sauce ( -1 == pas d'occurence )
          const userLiked = thing.usersLiked.indexOf(req.auth.userId);
          const userDisliked = thing.usersDisliked.indexOf(req.auth.userId);
          // n'afficher que l'identifiant de l'utilisateur dans la liste des likes et dislikes, pour confidentialité.
          if (userLiked > -1){thing.usersLiked = [req.auth.userId]}
          else {thing.usersLiked = [];}
          if (userDisliked > -1){thing.usersDisliked = [req.auth.userId]}
          else {thing.usersDisliked = [];}
        })
        res.status(200).json(things);
      })
      .catch(error => res.status(400).json({ error }));
    }

exports.likeSauce = (req, res, next) => {
    const sauceId = req.params.id;
    const userId = req.body.userId;
    const like = req.body.like;

    Thing.findOne({ _id: sauceId })
      .then(thing => {
        // recherche de userId dans les likes ou dislike de la sauce ( -1 == pas d'occurence )
        const userLiked = thing.usersLiked.indexOf(userId);
        const userDisliked = thing.usersDisliked.indexOf(userId);

        switch(true){
          // pas déjà liké ni disliké, et demande de like
        case (userLiked==-1 && userDisliked==-1 && like==1):
            Thing.updateOne({_id: sauceId},{$push:{usersLiked:userId},$inc:{likes:1}})
            .then(() => res.status(200).json({ message: 'Ok'}))
            .catch(error => res.status(400).json({ error }));
            break;
          // pas déjà liké ni disliké, et demande de dislike
        case (userLiked==-1 && userDisliked==-1 && like==-1):
            Thing.updateOne({_id: sauceId},{$push:{usersDisliked:userId},$inc:{dislikes:1}})
            .then(() => res.status(200).json({ message: 'Ok'}))
            .catch(error => res.status(400).json({ error }));
            break;
          // déjà liké, et demande de retrait du like
        case (userLiked>-1 && like==0):
            Thing.updateOne({_id: sauceId},{$pull:{usersLiked:userId},$inc:{likes:-1}})
            .then(() => res.status(200).json({ message: 'Ok'}))
            .catch(error => res.status(400).json({ error }));
            break;
          // déjà liké, et demande de dislike (fonction bloquée en frontend)
        case (userLiked>-1 && like==-1):
            Thing.updateOne({_id: sauceId},{$push:{usersDisliked:userId},$pull:{usersLiked:userId},$inc:{likes:-1},$inc:{dislikes:1}})
            .then(() => res.status(200).json({ message: 'Ok'}))
            .catch(error => res.status(400).json({ error }));
            break;
          // déjà disliké, et demande de retrait du dislike
        case (userDisliked>-1 && like==0):
            Thing.updateOne({_id: sauceId},{$pull:{usersDisliked:userId},$inc:{dislikes:-1}})
            .then(() => res.status(200).json({ message: 'Ok'}))
            .catch(error => res.status(400).json({ error }));
            break;
          // déjà disliké, et demande de like (fonction bloquée en frontend)
        case (userDisliked>-1 && like==1):
            Thing.updateOne({_id: sauceId},{$push:{usersLiked:userId},$pull:{usersDisliked:userId},$inc:{likes:1},$inc:{dislikes:-1}})
            .then(() => res.status(200).json({ message: 'Ok'}))
            .catch(error => res.status(400).json({ error }));
            break;
        }
      })
      .catch(error => res.status(400).json({ error }));
}