var log = require('./logging').newLogger(module.id, "debug")
  , config = require('./config')
  , redis = require('redis')
  , util = require('util')
  , async = require('async')
  , readClient, writeClient
  , redisReadReady = false
  , redisWriteReady = false
  
;

var me = module.exports = {
                           
	  init : function(){
		"use strict";	
		if(config.instanceData.environment === 'production') {
			
			log.info('Connecting to REDIS datastore in PRODUCTION');
			
			readClient = redis.createClient(null, config.instanceData.redisReadServer, config.instanceData.redisReadOptions || null);
			writeClient = redis.createClient(null, config.data.redisWriteServer, config.data.redisWriteOptions || null);
			
		} else {
			
			log.warn('Connecting to REDIS datastore NOT in PRODUCTION');
			
			readClient = redis.createClient(null, null, config.instanceData.redisReadOptions || null);
			writeClient = redis.createClient(null, null, config.data.redisWriteOptions || null);
			
			readClient.on('connect', function(err, res){
				"use strict";
				log.info('---} Redis readClient is CONNECTED');
			});
			
			readClient.on('end', function(err, res){
				"use strict";
				log.warn('---} Redis readClient ENDED');
			});
			
			readClient.on('drain', function(err, res){
				"use strict";
				log.debug('---} Redis readClient is DRAINED');
			});
			
			readClient.on('idle', function(err, res){
				"use strict";
				log.debug('---} Redis readClient is IDLE');
			});
			
			writeClient.on('connect', function(err, res){
				"use strict";
				log.info('---} Redis writeClient is CONNECTED');
			});
			
			writeClient.on('end', function(err, res){
				"use strict";
				log.warn('---} Redis writeClient ENDED');
			});
			
			writeClient.on('drain', function(err, res){
				"use strict";
				log.debug('---} Redis writeClient is DRAINED');
			});
			
			writeClient.on('idle', function(err, res){
				"use strict";
				log.debug('---} Redis writeClient is IDLE');
			});
		}
			
		readClient.on('ready', function(err, res){
			"use strict";
			redisReadReady = true;
			log.info('---} Redis readClient is READY');
		});
		
		readClient.on('error', function(err, res){
			"use strict";
			log.error('---} Redis readClient ERRORED');
			log.error('DATA: '+util.inspect(res));
			log.error('ERROR: '+util.inspect(err));
			throw new Error('Redis Failed!: '+err);
		});
		
		
		writeClient.on('ready', function(err, res){
			"use strict";
			redisWriteReady = true;
			log.info('---} Redis writeClient is READY');
		});
		
		writeClient.on('error', function(err, res){
			"use strict";
			log.error('---} Redis writeClient ERRORED');
			log.error('DATA: '+util.inspect(res));
			log.error('ERROR: '+util.inspect(err));
			throw new Error('Redis Failed!: '+err);
		});
	  }

	, isReady : function(){
		"use strict";
		if(redisReadReady && redisWriteReady){
			log.info('REDIS Client(s) initialised');
			return true;
		} else {
			return false;
		}
	  }

	, closeConnection : function(){
		"use strict";
		readClient.quit();
		writeClient.quit();
	  }
	
	, getRedisClient : function(){
		"use strict";
		return writeClient;
	  }
	  
	, saveObject : function(key, obj, cb){
		"use strict";
		writeClient.set('tarnish-'+key, JSON.stringify(obj), cb);
	  }
	
	, loadObject : function(key, cb){
		"use strict";
		readClient.get('tarnish-'+key, function(err, data){
			if(err || !data){
				cb(err,{});
			} else {
				cb(null, JSON.parse(data));
			}
		});
	  }
	
	, configSave : function (cb) {
		"use strict";
		var data, instance;
		
		try {
			data = JSON.stringify(config.data);
			instance = JSON.stringify(config.instanceData);
		} catch (e) {
			return cb(e,false);
		}
		if(config.getConfigFromDB){
			async.parallel({
				
				  generalConfig : function(done){
					"use strict";
					writeClient.set('tarnish-config', data, done);	
				  }
			
				, instanceConfig : function(done){
					"use strict";
					writeClient.set('tarnish-config-instance-'+config.instanceData.serverId, instance, done);	
				  }
				
				, publishGeneral : function(done){
					"use strict";
					writeClient.publish('tarnish-config-channel', data, done);		
				  }
				
			}, function(err, data){
				"use strict";
		        if (err || data.generalConfig != 'OK' || data.instanceConfig !='OK' || (data.publishGeneral < 0 || typeof data.publishGeneral != 'number') ) {
		        	log.error(util.inspect(data, {colors:true, showHidden: true, maxDepth: 5}));
		            log.error(util.inspect(err, {colors:true, showHidden: true, maxDepth: 5}));
		            cb(err, data);
		        } else {
		        	cb(null, true);	
		        }
			});
		 } else {
			 config.getConfigFromDB = true; 
			 cb(null, true);
		 }
	  }
	
	, configLoad : function (cb) {
		"use strict";
		async.parallel({
			
			  generalConfig : function(done){
				"use strict";
			    readClient.get('tarnish-config', done)
		      }
		
			, instanceConfig : function(done){
				"use strict";
			    readClient.get('tarnish-config-instance-'+config.instanceData.serverId, done)
		      }
			
		}, function(err, data){
			"use strict";
	        if (err || !data.generalConfig || !data.instanceConfig) {
	            log.error(util.inspect(err, {colors:true, showHidden: true, maxDepth: 5}));
	            cb(err, data);
	        } else {
	        	try {
			        config.data = JSON.parse(data.generalConfig);
			        config.instanceData = JSON.parse(data.instanceConfig);
			        cb(null, true);
	        	} catch (e) {
	        		log.error(util.inspect(err, {colors:true, showHidden: true, maxDepth: 5}));
	        		log.error(util.inspect(data, {colors:true, showHidden: true, maxDepth: 5}));
	        		log.error(util.inspect(e, {colors:true, showHidden: true, maxDepth: 5}));
	        		cb(e, false);
	        	}
	        	
	        }
		});
	  }
};
