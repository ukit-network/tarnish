
/**
 * Module dependencies.
 */
require('./lib/extendJS'); 
var log = require('./lib/logging').newLogger(module.id)
  , config = require('./lib/config')
  , express = require('express')
  , routes = require('./routes')
  , ptools = require('./lib/processTools')
  , dataStore = require('./lib/redisDatastore')
  , security = require('./lib/security')
  , util = require('util')
  , http = require('http')
  , path = require('path')
  , immediately = global.setImmediate || process.nextTick
;

var app = express();

log.warn("System starting...");

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hjs');
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	config.setExecutionEnvironment(config.development);
	app.use(express.logger('dev'));
	app.use(express.errorHandler());
});

app.get('/', routes.index);


var checkStart = function(){
	if(dataStore.isReady){
		ptools.started(function(){
		
			// Comes in here on exit to cleanly shutdown application
			log.debug("Shutting down application");
			
			/* CALL CLEAN SHUTDOWN FUNCTIONS */
			dataStore.closeConnection();
			
			// return false to say the application could not be shutdown cleanly!
			return true;
		});
		
		dataStore.configLoad(function(err, status){
			if(!err & status){
				log.warn("Config loaded OK");
			} else {
				log.error("Config NOT loaded - could be first execution: "+util.inspect(err, {colors: true, showHidden: true, maxDepth: 5}));
			}
			log.info("Starting server " + config.instanceData.serverPort  + ' - environment: ' + app.get('env'));
			http.createServer(app).listen(config.instanceData.serverPort, function () {
				security.downgradeExecution(config.instanceData.user,config.instanceData.group);
				http.globalAgent.maxSockets = config.data.maxHttpSockets;
				log.warn(config.getVersion());
				log.warn("Server listening on port " + config.instanceData.serverPort  + ' - environment: ' + app.get('env'));
				log.warn("This servers identifier: "+config.getServerId());
				log.info("Saving current config...");
				dataStore.configSave(function(err, status){
					if(err || !status){
						log.error("Config NOT saved - something is broken: "+util.inspect(err, {colors: true, showHidden: true, maxDepth: 5}));
					} else {
						log.info("Config saved OK");
					}
					log.info("SERVICE RUNNING...");
				});
			});			
		});
	} else {
		immediately(checkStart);
	}
};
checkStart();
