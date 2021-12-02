const Thing = require('../models/Sauces');
const fs = require('fs');

exports.createThing = (req, res, next) => {
  const thingObject = JSON.parse(req.body.sauce);
  delete thingObject._id;
  thingObject.likes=0;
  thingObject.dislikes=0;
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
      .then(thing => res.status(200).json(thing))
      .catch(error => res.status(400).json({ error }));
  }

exports.modifyThing = (req, res, next) => {
  const thingObject = req.file ?
    {
      ...JSON.parse(req.body.thing),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  Thing.updateOne({ _id: req.params.id }, { ...thingObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Objet modifié !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.deleteThing = (req, res, next) => {
  Thing.findOne({ _id: req.params.id })
    .then(thing => {
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
      .then(things => res.status(200).json(things))
      .catch(error => res.status(400).json({ error }));
    }

exports.likeSauce = (req, res, next) => {
    const sauceId = req.params.id;
    const userId = req.body.userId;
    const like = req.body.like;
    const liked = 0;
    //console.log(sauceId,userId,like,liked);

    Thing.findOne({ _id: sauceId })
      .then(thing => {
        if(thing.usersLiked.indexOf(userId)>=0){liked = 1};
        if(thing.usersDisliked.indexOf(userId)>=0){liked = -1};
        if(like==liked){res.status(201)};
        //console.log(thing);

        switch(true){
        case (liked==0 && like==1):
            Thing.updateOne({_id: sauceId},{$push:{usersLiked:userId},$inc:{likes:1}})
            .then(() => res.status(200).json({ message: 'Ok'}))
            .catch(error => res.status(400).json({ error,message: '1111' }));
            break;
        case (liked==0 && like==-1):
            Thing.updateOne({_id: sauceId},{$push:{usersDisliked:userId},$inc:{dislikes:1}})
            .then(() => res.status(200).json({ message: 'Ok'}))
            .catch(error => res.status(400).json({ error,message: '2222' }));
            break;
        case (liked==1 && like==0):
            Thing.updateOne({_id: sauceId},{$pull:{usersLiked:userId},$inc:{likes:-1}})
            .then(() => res.status(200).json({ message: 'Ok'}))
            .catch(error => res.status(400).json({ error,message: '3333' }));
            break;
        case (liked==1 && like==-1):
            Thing.updateOne({_id: sauceId},{$push:{usersDisliked:userId},$pull:{usersLiked:userId},$inc:{likes:-1},$inc:{dislikes:1}})
            .then(() => res.status(200).json({ message: 'Ok'}))
            .catch(error => res.status(400).json({ error,message: '4444' }));
            break;
        case (liked==-1 && like==0):
            Thing.updateOne({_id: sauceId},{$pull:{usersDisliked:userId},$inc:{dislikes:-1}})
            .then(() => res.status(200).json({ message: 'Ok'}))
            .catch(error => res.status(400).json({ error,message: '5555' }));
            break;
        case (liked==-1 && like==1):
            Thing.updateOne({_id: sauceId},{$push:{usersLiked:userId},$pull:{usersDisliked:userId},$inc:{likes:1},$inc:{dislikes:-1}})
            .then(() => res.status(200).json({ message: 'Ok'}))
            .catch(error => res.status(400).json({ error,message: '6666' }));
            break;
        }
      })
      .catch(error => res.status(400).json({ error,message:'messagederreur' }));
}