var models = require('../models/models.js');

// Autoload - factoriza el código si ruta incluye :quizId
exports.load = function(req, res, next, quizId) {
  models.Quiz.find(quizId).then(
    function(quiz) {
      if (quiz) {
        req.quiz = quiz;
        next();
      } else { next(new Error('No existe quizId=' + quizId)); }
    }
  ).catch(function(error) { next(error);});
};

// GET /quizes
exports.index = function(req, res) {
    var textoBus='Todos',
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
      res.render('quizes/index', { quizes: quizes, textoBus:textoBus});
    }
  ).catch(function(error) { next(error);})
};
 
// GET /quizes/:id
exports.show = function(req, res) {
  res.render('quizes/show', { quiz: req.quiz});
};


// GET /quizes/:id/answer
exports.answer = function (req, res) {
    var resultado = 'Incorrecto';
  if (req.query.respuesta === req.quiz.respuesta) {
    resultado = 'Correcto';
  }
  res.render('quizes/answer', {quiz: req.quiz, respuesta: resultado});
}