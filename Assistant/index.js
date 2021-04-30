// ASK MY ASSISTANT
'use strict';
function AlexaSkill(appId) {
    this._appId = appId;
}

AlexaSkill.prototype.requestHandlers = {
    LaunchRequest: function (event, context, response) {
        this.eventHandlers.onLaunch.call(this, event.request, event.session, response);
    },
    IntentRequest: function (event, context, response) {
        this.eventHandlers.onIntent.call(this, event.request, event.session, response);
    },
    SessionEndedRequest: function (event, context) {
        this.eventHandlers.onSessionEnded(event.request, event.session);
        context.succeed();
    }
};

AlexaSkill.prototype.eventHandlers = {
    onSessionStarted: function (sessionStartedRequest, session) {
    },
    onLaunch: function (launchRequest, session, response) {
        throw "onLaunch should be overriden by subclass";
    },
    onIntent: function (intentRequest, session, response) {
        var intent = intentRequest.intent,
            intentName = intentRequest.intent.name,
            intentHandler = this.intentHandlers[intentName];
        if (intentHandler) {
            intentHandler.call(this, intent, session, response);
        } else {
            throw 'Unsupported intent = ' + intentName;
        }
    },
    onSessionEnded: function (sessionEndedRequest, session) {
    }
};

AlexaSkill.prototype.intentHandlers = {};

AlexaSkill.prototype.execute = function (event, context) {
    try {
            if (this._appId && event.session.application.applicationId !== this._appId) {
            throw "Invalid applicationId";
        }

        if (!event.session.attributes) {
            event.session.attributes = {};
        }

        if (event.session.new) {
            this.eventHandlers.onSessionStarted(event.request, event.session);
        }
        var requestHandler = this.requestHandlers[event.request.type];
        requestHandler.call(this, event, context, new Response(context, event.session));
    } catch (e) {
        context.fail(e);
    }
};

var Response = function (context, session) {
    this._context = context;
    this._session = session;
};

Response.prototype = (function () {
    var buildSpeechletResponse = function (options) {
        var alexaResponse = {
            outputSpeech: {
                type: 'PlainText',
                text: options.output
            },
            shouldEndSession: options.shouldEndSession
        };
        if (options.reprompt) {
            alexaResponse.reprompt = {
                outputSpeech: {
                    type: 'PlainText',
                    text: options.reprompt
                }
            };
        }
        
        var returnResult = {
            version: '1.0',
            response: alexaResponse
        };
        if (options.session && options.session.attributes) {
            returnResult.sessionAttributes = options.session.attributes;
        }
        return returnResult;
    };

    return {
        tell: function (speechOutput) {
            this._context.succeed(buildSpeechletResponse({
                session: this._session,
                output: speechOutput,
                shouldEndSession: true
            }));
        },
        ask: function (speechOutput, repromptSpeech) {
            this._context.succeed(buildSpeechletResponse({
                session: this._session,
                output: speechOutput,
                reprompt: repromptSpeech,
                shouldEndSession: false
            }));
        }
    };
})();

var APP_ID = undefined; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var http = require('http');

var NotesAssistant = function () {
    AlexaSkill.call(this, APP_ID);
};
NotesAssistant.prototype = Object.create(AlexaSkill.prototype);
NotesAssistant.prototype.constructor = NotesAssistant;

var phrase = "";
var host = 'http://your IP:55439/';
var service_name = "?assistant";
var options = {
    host: 'your IP',
    port: 55439,
    path: '/?assistant=*end*'
};
        
NotesAssistant.prototype.intentHandlers =
{
    WordsIntent: function (intent, session, response)
    {
        phrase = intent.slots.Phrase.value;
        if (phrase === undefined) 
        {
            phrase = "";
        }
        if (phrase !== "") 
        {
            HTTP_Request(response);
            
        } else {
            response.ask("Sorry.");
        }
    },
    
   "AMAZON.StopIntent": function (intent, session, response) 
   {    
        var req = http.request(options, res => {
            var responseString = "";
            res.on('data', chunk => {
                responseString = responseString + chunk;
            });
            res.on('end', () => 
            {
                response.tell("Good bye");
            });
        });
        req.end();
   },
      
   "AMAZON.CancelIntent": function (intent, session, response) 
   { 
        var req = http.request(options, res => {
            var responseString = "";
            res.on('data', chunk => {
                responseString = responseString + chunk;
            });
            res.on('end', () => 
            {
                response.tell("Canceled");
            });
        });
        req.end();
   }
};

function HTTP_Request(response) {
    var msg = service_name + "=" + phrase;
    var endpoint = host + msg;
    http.get(endpoint, function (res) {
        var result = "";
        res.on('data', function (data) {
            result += data;
        });
        res.on('end', function () {
            response.ask(result);
        });
    });
}

NotesAssistant.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) 
{ 
};

NotesAssistant.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) 
{
    var speechOutput = "Ready:";
    response.ask(speechOutput);
};

NotesAssistant.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) 
{  
};

exports.handler = function (event, context) {
    var notesAssistant = new NotesAssistant();
    notesAssistant.execute(event, context);
};