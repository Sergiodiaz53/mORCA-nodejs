/**
 * Created by Yeyo on 17/10/16.
 */

var jsdom = require("jsdom").jsdom;
var doc = jsdom();
var window = doc.defaultView;
var $ = require("jquery")(window);
var soap = require('../node_modules/jquery-soap/lib/jquery.soap.js');
var jobs = require('./jobs');


var configureSoap = function(req, res) {
    console.log("Configuring SOAP");
    soap.soap({
        url: 'http://chirimoyo.ac.uma.es/ApiWs/services/Api',
        appendMethodToURL: false,
        SOAPAction: '',
        crossDomain: true,
        timeout: 3600000,

        envAttributes: { // additional attributes (like namespaces) for the Envelope:
            'xmlns:q0':      'http://api.bitlab.org',
            'xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
            'xmlns:xsd':     'http://www.w3.org/2001/XMLSchema',
            'xmlns:xsi':     'http://www.w3.org/2001/XMLSchema-instance',
        },

        HTTPHeaders: {},

        error: function(soapResponse) {
            console.log(SoapResponse.toString());
        }
    });
};

var getToolListAsXML = function(req, send) {
    configureSoap();
    var reponame = 'Bitlab [chirimoyo.ac.uma.es]';
    soap.soap({
        method: 'getToolListAsXML',
        namespaceQualifier: 'q0',

        data: {
            getEmptyFC: 'true',
            repoid: reponame.toString()
        },

        success: function(soapResponse) {
            console.log(soapResponse.toString());
        },
        error: function(SOAPResponse) {
            console.log(SOAPResponse.toString());
        }
    });
};

var executeService = function (req, res) {

    var xml2js = require('xml2js');
    var parser = new xml2js.Parser({explicitArray: false});

    var rawBody = req.body;
    var serviceName;

    parser.parseString(rawBody, function (err, result) {
        serviceName = result['soapenv:Envelope']['soapenv:Body']['q0:executeService']['q0:urlOperation'];
    });

    console.log("Forwarding request");
    console.log(req.url);

    var newUrl = 'http://chirimoyo.ac.uma.es/ApiWs/services/Api';
};

var executeServiceJSON = function (req, res) {

    var inputList = req.body[0];
    var outputList = req.body[1];
    var urlOperation = req.body[2];
    var idOperation = req.body[3];
    var nameFile = req.body[4];
    var idFolder = req.body[5];
    var token = req.body[6];
    var user = req.body[7];
    var repoID = req.body[8];

    var jobID;

    var userName = user.toString();
    var serviceName = urlOperation.split(':').pop();
    var outputFile = "";
    var status = "Running";

    res.sendStatus(200);

    addJob(userName, serviceName, outputFile, nameFile, status, function(err, job){
       jobID = job._id;
    });

    configureSoap(req, res);

    soap.soap({
        method: 'executeService',
        namespaceQualifier: 'q0',

        data: function (SOAPObject) {
            SOAPObject = new SOAPObject("soapenv:Body")
            var execute = SOAPObject.newChild('q0:executeService')

            //Creating input parameters list
            for (var x in inputList) {
                var input = execute.newChild("q0:inputList")

                if (inputList[x][0] != null) {
                    input.addParameter("q0:data", inputList[x][0])
                } else {
                    input.newChild("q0:data").attr("nil", "true");
                }

                if (inputList[x][1] != null) {
                    input.addParameter("q0:dataType", inputList[x][1])
                } else {
                    input.newChild("q0:dataType").attr("nil", "true");
                }

                if (inputList[x][2] != null) {
                    input.addParameter("q0:format", inputList[x][2])
                } else {
                    input.newChild("q0:format").attr("nil", "true");
                }

                if (inputList[x][3] != null) {
                    input.addParameter("q0:name", inputList[x][3])
                } else {
                    input.newChild("q0:name").attr("nil", "true");
                }

                if (inputList[x][4] != null) {
                    input.addParameter("q0:paramType", inputList[x][4])
                } else {
                    input.newChild("q0:paramType").attr("nil", "true");
                }

                if (inputList[x][5] != null) {
                    input.addParameter("q0:store", inputList[x][5])
                } else {
                    input.newChild("q0:store").attr("nil", "true");
                }

                if (inputList[x][6] != null) {
                    input.addParameter("q0:type", inputList[x][6])
                } else {
                    input.newChild("q0:type").attr("nil", "true");
                }

                if (inputList[x][6] != null) {
                    input.addParameter("q0:file", inputList[x][7])
                } else {
                    input.newChild("q0:file").attr("nil", "true");
                }

            }

            //Creating output parameters list
            for (var y in outputList) {
                var output = execute.newChild("q0:outputList")
                output.addParameter("q0:data", outputList[y][0])
                output.addParameter("q0:dataType", outputList[y][1])
                output.addParameter("q0:format", outputList[y][2])
                output.addParameter("q0:name", outputList[y][3])
                output.addParameter("q0:paramType", outputList[y][4])
                output.addParameter("q0:store", outputList[y][5])
                output.addParameter("q0:type", outputList[y][6])
                output.addParameter("q0:file", outputList[y][7])
            }

            //Creating service parameters
            execute.addParameter("q0:urlOperation", urlOperation.toString())
            execute.addParameter("q0:idOperation", idOperation.toString())
            execute.addParameter("q0:nameFile", nameFile.toString())
            execute.addParameter("q0:idFolder", idFolder.toString())
            execute.addParameter("q0:token", token.toString())
            execute.addParameter("q0:user", user.toString())
            execute.addParameter("q0:repoid", repoID.toString())

            return SOAPObject;
        },

        beforeSend: function (soapResponse) {
            console.log("SENDING...");
            console.log(soapResponse.toString());

        },

        success: function (soapResponse) {
            var xml = soapResponse.toString();
            var parseString = require('xml2js').parseString;
            var outputFile;

            console.log(soapResponse);

            parseString(xml, function (err, result) {
                outputFile =result["soapenv:Envelope"]["soapenv:Body"][0]["executeServiceResponse"][0]["executeServiceReturn"][0];
            });

            if(outputFile.indexOf('chirimoyo:files:')>-1) {
                jobs.updateJob(jobID, outputFile,'finished')
            } else {
                jobs.updateJob(jobID, "InvalidInput",'failed')
            }

        },

        error: function (soapResponse) {
            console.log("Error executing service");
            console.log(soapResponse);
            jobs.updateJob(jobID, "NOT",'failed')
        }
    });

    function addJob (userName, serviceName, outputFile, nameFile, status, cb){
        jobs.addJob(userName, serviceName, outputFile, nameFile, status, cb)
    }
};


module.exports = {
    configureSoap: configureSoap,
    executeServiceJSON: executeServiceJSON
};