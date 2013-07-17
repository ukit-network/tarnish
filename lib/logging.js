var winston = require('winston')
  , config = require('./config');

var container = new winston.Container({
	  maxListeners: 0
	  
});

container.emitErrs = false;

var me = module.exports = {

	newLogger : function(category, level){
		var label;
		
		if(config.root && config.root.length >1){
			label = category.replace(config.root,'');
		} else {
			label = category.split('/');
			label = label[label.length - 1];
		}
			
		label = label.split('.')[0];
	
		if(process.env.NODE_ENV != "development") level = process.env.LOG_LEVEL;
		
		container.add(category, {
			
			console : {
	        	level: level || process.env.LOG_LEVEL || "info",
	  			colorize: 'true',
	  			timestamp: true,
	  			label: label,
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
