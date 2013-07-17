var log = require('./logging').newLogger(module.id)
  , shutdownFunction = null
  , me = module.exports = {

	shutdown : function(){
	"use strict";
		try {
			log.warn('Shutting Down Application...');

			if(shutdownFunction) {
				log.debug('Running application shutdown fuctions'); 
				if(!shutdownFunction()){
					throw new Error("Application could NOT shudown cleanly!");
				};
			} else {
				log.warn('Application did not define any shutdown fuctions?');
			};

			log.warn('All connections finished processing');
		} catch (err) {
			throw new Error("Failed to shutdown cleanly: " + err);
		}
		log.warn('Application terminated!!!!');
		process.exit(0);
	},

	started : function(onShutdown) {
	"use strict";
		shutdownFunction = onShutdown;
		if(process && typeof process.send == 'function') process.send('online');
	}
};

process.on('message', function(message) {
	"use strict";
	if (message === 'shutdown') {
		me.shutdown();
	}
});

process.on('SIGINT', function() {
	"use strict";
	me.shutdown();
});
