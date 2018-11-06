const UserController = require('../controllers/users');

module.exports = function(app){
    // routing
    app.get('/', UserController.index);
    // show all users route
    app.get('/user/new', UserController.new);
    // process new user registration
    app.post('/user/new', UserController.create);
    // view an individual user page
    app.get('/user/:_id', UserController.show);
    // edit individual user route
    app.get('/user/:_id/edit', UserController.edit);
    // these two routes do not exist yet
    app.post('/user/:_id/update', UserController.update);
    // login route
    app.post('/login', UserController.login);
    // logout route
    app.get('/logout', UserController.logout);
    // delete user route
    app.get('/user/:_id/delete', UserController.destroy);

    // catch 404 and forward to error handler
    app.use((request, response, next) => {
        const err = new Error('Not Found');
        err.status = 404;
        next(err);
    });
    
    // error handler
    app.use((err, request, response, next) => {
        // set locals, only providing error in development
        response.locals.message = err.message;
        response.locals.error = request.app.get('env') === 'development' ? err : {};
        response.status(err.status || 500);
        // render the error page
        response.render('error', {title: 'Error page'});
      });
};