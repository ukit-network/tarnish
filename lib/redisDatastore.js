var log = require('./logging').newLogger(module.id)
  , config = require('./config')
  , redis = require('redis')
  , util = require('util')
  , async = require('async')
  , readClient, writeClient
  , redisReadReady = false
  , redisWriteReady = false
  
;
  
if(process.env.NODE_ENV === 'production'){
	readClient = redis.createClient(null, config.instanceData.redisReadServer, config.instanceData.redisReadOptions || null);
	writeClient = redis.createClient(null, config.data.redisWriteServer, config.data.redisWriteOptions || null);
}else {
	readClient = redis.createClient(null, null, config.instanceData.redisReadOptions || null);
	writeClient = redis.createClient(null, null, config.data.redisWriteOptions || null);
	
	readClient.on('connect', function(err, res){
		log.debug('---} Redis readClient is CONNECTED');
	});
	
	readClient.on('end', function(err, res){
		log.debug('---} Redis readClient ENDED');
	});
	
	readClient.on('drain', function(err, res){
		log.debug('---} Redis readClient is DRAINED');
	});
	
	readClient.on('idle', function(err, res){
		log.debug('---} Redis readClient is IDLE');
	});
	
	writeClient.on('connect', function(err, res){
		log.debug('---} Redis writeClient is CONNECTED');
	});
	
	writeClient.on('end', function(err, res){
		log.debug('---} Redis writeClient ENDED');
	});
	
	writeClient.on('drain', function(err, res){
		log.debug('---} Redis writeClient is DRAINED');
	});
	
	writeClient.on('idle', function(err, res){
		log.debug('---} Redis writeClient is IDLE');
	});
}

readClient.on('ready', function(err, res){
	redisReadReady = true;
	log.debug('---} Redis readClient is READY');
});

readClient.on('error', function(err, res){
	log.error('---} Redis readClient ERRORED');
	log.error('DATA: '+util.inspect(res));
	log.error('ERROR: '+util.inspect(err));
	throw new Error('Redis Failed!: '+err);
});


writeClient.on('ready', function(err, res){
	redisReadReady = true;
	log.debug('---} Redis writeClient is READY');
});

writeClient.on('error', function(err, res){
	log.error('---} Redis writeClient ERRORED');
	log.error('DATA: '+util.inspect(res));
	log.error('ERROR: '+util.inspect(err));
	throw new Error('Redis Failed!: '+err);
});


var me = module.exports = {
	
	  isReady : function(){
		return redisReadReady && redisWriteReady;
	  }

	, closeConnection = function(){
		readClient.quit();
		writeClient.quit();
	  }
	
	, saveObject : function(key, obj, cb){
		writeClient.set('tarnish-'+key, JSON.stringify(obj), cb);
	  }
	
	, loadObject : function(key, cb){
		readClient.get('tarnish-'+key, function(err, data){
			if(err || !data){
				cb(err,{});
			} else {
				cb(null, JSON.parse(data));
			}
		});
	  }
	
	, configSave : function (cb) {
		var data = JSON.stringify(config.data);

		async.parallel({
			  generalConfig : function(done){
				writeClient.set('tarnish-config', data, done);	
			  }
		
			, instanceConfig : function(done){
				writeClient.set('tarnish-config-instance-'+config.instanceData.serverId, config.instanceData, done);	
			  }
			
			, publishGeneral : function(done){
				writeClient.publish('tarnish-config-channel', data, done);		
			  }
		}, function(err, data){
	        if (err || !data.generalConfig || !data.instanceConfig || !data.publishGeneral) {
	            log.error(util.inspect(err, {colors:true, showHidden: true, maxDepth: 5}));
	            cb(err, data);
	        } else {
	        	cb(null, true);	
	        }
		});
	  }
	
	, configLoad : function (cb) {
		
		async.parallel({
			
			  generalConfig : function(done){
			    readClient.get('tarnish-config', done)
		      }
		
			, instanceConfig : function(done){
			    readClient.get('tarnish-config-instance-'+config.instanceData.serverId, done)
		      }
			
		}, function(err, data){
	        if (err || !data.generalConfig || !data.instanceConfig) {
	            log.error(util.inspect(err, {colors:true, showHidden: true, maxDepth: 5}));
	            cb(err, data);
	        } else {
		        config.data = JSON.parse(data.generalConfig);
		        config.instanceData = JSON.parse(data.instanceConfig);
		        cb(null, true);
	        }
		});
	  }
};
