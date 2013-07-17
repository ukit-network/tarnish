require('./lib/extendJS');
var config = require('./lib/config');
config.root = __dirname;

var log = require('./lib/logging').newLogger(__dirname+'/app.js')
  , config = require('./lib/config')
  , express = require('express')
  , routes = require('./routes')
  , ptools = require('./lib/processTools')
  , dataStore = require('./lib/redisDatastore')
  , security = require('./lib/security')
  , util = require('util')
  , http = require('http')
  , immediately = global.setImmediate || process.nextTick
;

var app = express();


log.info("System starting...");

app.configure(function(){
  if(config.trustProxy){
	  log.warn("Configured for using frontend proxy, 'x-forwarded-for' will be trusted");
	  app.enable('trust proxy');
  }
  if(config.logTimes){
	  log.warn("Configured to log timings, this will degrade performance");
	  app.use(express.responseTime())
  }
  app.use(express.static(config.root + '/public'));
  app.use(require('less-middleware')({ src: config.root + '/public' }));
  app.set('views', config.root + '/views');
  app.set('view engine', 'html');
  app.engine('html', require('hogan-express'));
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
});

app.configure('development', function(){
	config.setExecutionEnvironment(config.development);
	app.use(express.logger('dev'));
	app.use(express.errorHandler());
});



var checkStart = function(){
	
	if(dataStore.isReady()){
		
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
				log.info("Config loaded OK");
			} else {
				log.error("Config NOT loaded - could be first execution: "+util.inspect(err, {colors: true, showHidden: true, maxDepth: 5}));
			}
			
			if(config.data.useSessions){
				log.warn("Server configured to provide sessions");
				app.use(express.cookieParser(config.data.cookieSecret));
				app.use(express.session({
					  key : config.data.cookieId
					, secret : config.data.cookieSecret
					, cookie : {
						  path : '/'
						, httpOnly : true
						, maxAge : config.data.cookieAge
					  }
					
					, store : new sessionStore({
						  client : datastore.getRedisClient()
						, db : config.data.sessionDatabase
						, prefix : config.data.sessionPrefix
					})
				}));
			} else {
				log.warn("Server configured NOT to provide sessions");	
			}
			
			app.use(app.router);			
			
			app.all('*', routes.index);
			
			log.info("Starting server " + config.instanceData.serverPort  + ' - environment: ' + app.get('env'));
			
			http.createServer(app).listen(config.instanceData.serverPort, function () {
				http.globalAgent.maxSockets = config.data.maxHttpSockets;
				security.downgradeExecution(config.instanceData.user,config.instanceData.group);
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
dataStore.init();
checkStart();
