var log = require('./logging').newLogger(module.id)
  , me = module.exports = {
	
	downgradeExecution : function(user, group){
	"use strict";
		try {

			process.setgid(group);
			log.warn('SERVICE RUNNING AS GROUP: [NOGROUP]')
			
			try {
				process.setuid(user);
				log.warn('SERVICE RUNNING AS USER: [NODEUSER]')
			} catch (err) {
				log.error('###### Failed to set UID: ' + err + ' ######');
				log.error('###### PROCESS COULD STILL BE RUNNING AS ROOT ######');	
			}
		} catch (err) {
			log.error('###### Failed to set GID: ' + err + ' ######');
			log.error('###### PROCESS COULD STILL BE RUNNING AS ROOT ######');			
		}	
	  }
};