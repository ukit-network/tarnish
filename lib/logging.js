var winston = require('winston');

var container = new winston.Container({
	  maxListeners: 0
	  
});

container.emitErrs = false;

var me = module.exports = {

	newLogger : function(category, level){
	
		if(process.env.NODE_ENV != "development") level = process.env.LOG_LEVEL;
		
		container.add(category, {
			
			console : {
	        	level: level || process.env.LOG_LEVEL || "info",
	  			colorize: 'true',
	  			timestamp: true,
	  			label: category,
	  			maxListeners: 999,
	  			handleExceptions: false,
	  			exitOnError: false,
	  			json : false
	  		} 
		});
		
		var newLog = container.get(category, {
			maxListeners : 999
		});
		
		newLog.emitErrs = false;
		newLog.exitOnError = true;
				
		newLog.debug("Logging Container Instantiated");
		
		return newLog;
	}
};
