var models = require('../models/models.js');

// Autoload - factoriza el código si ruta incluye :quizId
exports.load = function (req, res, next, quizId) {
    models.Quiz.find({
        where: {
            id: Number(quizId)
        },
        include: [{
                model: models.Comment
            }]
    }).then(function (quiz) {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            next(new Error('No existe quizId=' + quizId))
        }
    }
    ).catch(function (error) {
        next(error)
    });
};

// GET /quizes
exports.index = function(req, res) {
    var textoBus='Todas las preguntas',
            search,
    sql={order:'pregunta ASC'};
    if(req.query.search!=undefined){
        search = '%' + req.query.search.replace(/\s+/g,'%') + '%';
//        sql.where=['pregunta like ?',search];
        sql.where=['lower(pregunta) like lower(?)',search];// agregado porque en postgres no buscaba bien
        
    }
    
    models.Quiz.findAll(sql).then(
    function(quizes) {
        if(req.query.search!=undefined){
          switch(quizes.length){
              case 0:
                textoBus='Ningun Registro encontrado';
              break;
              case 1:
                textoBus='1 Registro encontrado';
                break;
              default:
                  textoBus=quizes.length+' Registros encontrados';
                break;
          }
          textoBus+=' filtrando por "'+req.query.search+'"';
      }
      res.render('quizes/index', { quizes: quizes, textoBus:textoBus, errors:[]});
    }
  ).catch(function(error) { next(error)});
};
 
// GET /quizes/:id
exports.show = function(req, res) {
  res.render('quizes/show', { quiz: req.quiz, errors:[]});
};// req.quiz: instancia de quiz cargada con autoload


// GET /quizes/:id/answer
exports.answer = function (req, res) {
    var resultado = 'Incorrecto';
  if (req.query.respuesta === req.quiz.respuesta) {
    resultado = 'Correcto';
  }
  res.render('quizes/answer', {quiz: req.quiz, respuesta: resultado, errors:[]});
}
var Temas=[
    {id:"otro",texto:"Otro"},
    {id:"humanidades",texto:"Humanidades"},
    {id:"ocio",texto:"Ocio"},
    {id:"ciencia",texto:"Ciencia"},
    {id:"tecnologia",texto:"Tecnología"},
];
// GET /quizes/new
exports.new = function(req, res) {
  var quiz = models.Quiz.build(
    {pregunta: "", respuesta: ""}
  );

  res.render('quizes/new', {quiz: quiz, temas:Temas, errors:[]});
};

// POST /quizes/create
exports.create = function(req, res) {
  var quiz = models.Quiz.build( req.body.quiz );

// guarda en DB los campos pregunta y respuesta de quiz
   quiz
  .validate()
  .then(
    function(err){
      if (err) {
        res.render('quizes/new', {quiz: quiz, temas:Temas, errors: err.errors});
      } else {
        quiz // save: guarda en DB campos pregunta y respuesta de quiz
        .save({fields: ["pregunta", "respuesta", "tema"]})
        .then( function(){ res.redirect('/quizes')}) 
      }      // res.redirect: Redirección HTTP a lista de preguntas
    }
  ).catch(function(error){next(error)});
}; 


// GET /quizes/:id/edit
exports.edit = function(req, res) {
  var quiz = req.quiz;  // req.quiz: autoload de instancia de quiz

  res.render('quizes/edit', {quiz: quiz, temas:Temas, errors: []});
};

// PUT /quizes/:id
exports.update = function(req, res) {
  req.quiz.pregunta  = req.body.quiz.pregunta;
  req.quiz.respuesta = req.body.quiz.respuesta;
  req.quiz.tema = req.body.quiz.tema;

  req.quiz
  .validate()
  .then(
    function(err){
      if (err) {
        res.render('quizes/edit', {quiz: req.quiz, errors: err.errors});
      } else {
        req.quiz     // save: guarda campos pregunta y respuesta en DB
        .save( {fields: ["pregunta", "respuesta", "tema"]})
        .then( function(){ res.redirect('/quizes');});
      }     // Redirección HTTP a lista de preguntas (URL relativo)
    }
  ).catch(function(error){next(error)});
};

// DELETE /quizes/:id
exports.destroy = function(req, res) {
  req.quiz.destroy().then( function() {
    res.redirect('/quizes');
  }).catch(function(error){next(error)});
};

//  console.log("req.quiz.id: " + req.quiz.id);

// GET statistics
exports.statistics = function(req, res) {
    
    models.Quiz.findAll({
        include: [{model: models.Comment}]
    }
            ).then(
        function (quizes) {
            var totalPregunta=0,
                totalComentario=0,
                totalComentarioAVG=0,
                totalPreguntaCon=0,
                totalPreguntaSin=0;
            var quizByCat = {
                ocio: [],
                ciencia: [],
                tecnologia: [],
                humanidades: [],
                otro: []
            };
            var j;
            for (j = 0; j < quizes.length; j++) {
                totalPregunta++;
                if(quizes[j].Comments.length){
                    totalPreguntaCon++;
                    totalComentario+=quizes[j].Comments.length;
                }
                quizByCat[quizes[j].tema].push({id: quizes[j].id, pregunta: quizes[j].pregunta});
            }
            totalComentarioAVG = totalComentario / totalPregunta;
            totalComentarioAVG=parseFloat(totalComentarioAVG).toFixed(2);
            totalPreguntaSin=totalPregunta-totalPreguntaCon;
//            console.dir(quizByCat);
//            res.render('temas', {tema: quizByCat, errors: []});
      
      res.render('quizes/statistics', {
          totalPregunta:totalPregunta,
          totalPreguntaCon:totalPreguntaCon,
          totalPreguntaSin:totalPreguntaSin,
          totalComentario:totalComentario, 
          totalComentarioAVG:totalComentarioAVG, 
          quizByCat:quizByCat, 
          errors:[]});
    }
  ).catch(function(error) { next(error)});
};