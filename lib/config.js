var me = module.exports = {
                           
      production : 0
    , development : 1
    , integration : 2
    , staging : 4
    
    , trustProxy : true
    , logTimes : true
    , getConfigFromDB : false
    , root : null
    
    , data : {
		  serviceName 			: "Tarnish Server"
		, maxHttpSockets		: 65535
		, useSessions			: false
		, cookieId				: 'sid'
		, cookieSecret			: 'whdfb;whi;vb;iqrvnu3q9rnv9q34nb2&^%$4kthfikv;wrg'
		, cookieAge				: 60*60*24*1000
		, sessionDatabase		: 'tarnish-sessions'
		, sessionPrefix			: 'tsess:'
		, redisWriteServer 		: process.env.REDIS_WRITE || '127.0.0.1'
	    , redisWriteOptions 	: {
									  connect_timeout : 10000
									, max_attempts : 5
									, retry_max_delay : 5000
								  }
	  }

	, instanceData : {
		  serverId 				: process.env.SERVER_ID || 'tarnish_server_01'
		, serverPort			: 81
		, user					: 'nodeuser'
		, group					: 'nogroup'
	    , serviceVersion 		: null
	    , environment			: 'production'
		, configLoaded			: false
		, redisReadServer 		: process.env.REDIS_READ || '127.0.0.1'
	    , redisReadOptions 		: {
									  connect_timeout : 10000
									, max_attempts : 5
									, retry_max_delay : 5000
								  }
	  	
	  }
	
	
	
	
	
	
/** Functions relating to Config **/
	
	, getVersion : function(){
		me.instanceData.serviceVersion = JSON.parse(require('fs').readFileSync('./package.json')).version;
		return me.data.serviceName + ' - V' + me.instanceData.serviceVersion;
	  }
	
	, getServerId : function(){
		return me.instanceData.serverId;
	}
	
	, setExecutionEnvironment : function(env){
		if((!env || env === me.production)){
			// REALLY DON'T WANT TO DO ANYTHING HERE, AS DEFAULT SHOULD BE PRODUCTION!!!!!
		} else if (env === me.development){
			
			me.instanceData.serverPort = 8081;
			me.instanceData.environment = 'development';
			
		} else if (env === me.integration){
			
			me.instanceData.serverPort = 8081;
			me.instanceData.environment = 'integration';
			
		} else if (env === me.staging){
			
			me.instanceData.serverPort = 8081;
			me.instanceData.environment = 'staging';
			
		} else {
			throw new Error('Unkown environment value passed [code]:'+env);
		}
	  }
};