
Router.route('/', function() {
  Template.render('Homepage');
});

Router.route('/test', function() {
  Template.render('Testpage');
});
