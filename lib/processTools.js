var log = require('./logging').newLogger(module.id)
  , domainError = require('express-domain-errors')
  , serverDomain = require('domain').create()
  , gracefulExit = require('express-gracefull-exit')
  , express = require('express')
  , app
  , server
  , shutdownFunction
  , me = module.exports = {

	  setApp : function(parent_app){
		app = parent_app;
	  }
	  
	, setExpress : function(parent_express){
		express = parent_express;
	  }
	  
	, setServer : function(parent_server){
		server = parent_server;
	  }
	  
	, middleware : function(){
		return domainError(shutdown);
	  }
	
	, start(parent_app, init, onShutdown){
		var startTimer;
		app = parent_app = express();
		app.use(domainError(me.shutdown));
		shutdownFunction = onShutdown;
		startTimer = setTimeout(function(){
			log.warn("Shutting down as failed to start within 30 seconds");
			me.shutdown();
		}, 30000);
		
		init(function(err){
			if(err){
				log.warn("Shutting down, as initialisation code failed");
				me.shutdown();
			} else {
				
				startTimer.cancel();
				server = app.listen(3000 || process.env.PORT);
		 		server.on('listening', function() {
		    			if(process && typeof process.send == 'function') process.send('online');
		 		});	
			}
		});
		
	  }  
	  
	, shutdown : function(err){
		"use strict";
		if(err){
			log.warn("Received shutdown message due to error: "+err);
		}
		
		log.warn('Shutting down instance...(Max. 30 second wait!)');
		
		setTimeout(function(){
			log.error("Forced shutdown, as instance did not shutdown cleanly within 30 seconds");
			try {
				if(app && server) gracefulExit.gracefulExitHandler(app, server);
			} catch (e) {
				log.error('Could not execute GRACEFUL EXIT: '+e);
			}
		
			try {
				process.exit(0);
			} catch (e) {
				throw new Error("Failed to shudown cleanly: "+e);
			}
		}, 30000);
		
		try {
			if(process && typeof process.send == 'function') process.send('offline');
			
			if(shutdownFunction) {
				log.debug('Running instance shutdown fuctions'); 
				if(!shutdownFunction()){
					log.error("Instance could NOT shudown cleanly!");
				};
			} else {
				log.warn('Instance did not define any shutdown fuctions?');
			}
			
			try {
				if(app && server) gracefulExit.gracefulExitHandler(app, server);
				log.warn('All connections finished processing');
			} catch (e) {
				log.error('Could not execute GRACEFUL EXIT: '+e);
			}
		} catch (e) {
			log.error("Failed to shutdown cleanly: " + e);
		}
		
		try {
			process.exit(0);
		} catch (e) {
			throw new Error("Failed to shudown cleanly: "+e);
		}
	},

	started : function(onShutdown) {
	"use strict";
		shutdownFunction = onShutdown;
		if(process && typeof process.send == 'function') process.send('online');
	}
};

process.on('message', function(message) {
	"use strict";
	log.warn("Received shutdown message from process message");
	if (message === 'shutdown') {
		me.shutdown();
	}
});

process.on('SIGINT', function() {
	"use strict";
	log.warn("Received shutdown message from SIGINT (ctrl+c)");
	me.shutdown();
});
