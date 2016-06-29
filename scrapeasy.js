var request = require("request")
var cheerio = require("cheerio")
var toSource = require("tosource")
var parsonic = require("parsonic")
var scraper = require("./scraper")
var maxSockets = 10
var stringifiedScraper = {}
Object.getOwnPropertyNames(scraper).filter(function(f){
    stringifiedScraper[f] = toSource(scraper[f])
})
function scrapeasy (url, pattern, callback){
    var results = {}, elements = {}
    var options = {
        'pool.maxSockets' : maxSockets,
         url : url,
         headers: {
             'User-Agent': 'scrapeasy'
        }
    }
    request(options, function(err, res, data){
         if(err){
            callback(err)
        }
        else{
            try{
                if(res.statusCode !== 200){
                    console.log("Status:", res.statusCode)
                }
                parsonic.load(data, {pattern: pattern, scraper: stringifiedScraper}, function(document, args){
                    var pattern = args.pattern
                    var elements = {}
                    var results = {}
                    var toEval = ""
                    Object.getOwnPropertyNames(args.scraper).filter(function(f){
                        toEval += args.scraper[f]
                    })
                    eval(toEval)
                    var selectors = Object.getOwnPropertyNames(pattern)
                    var asProperties = {}
                    elements["*"] = document.querySelectorAll("*")
                    for(var i = 0; i < selectors.length; i++){
                        elements[selectors[i]] = document.querySelectorAll(selectors[i])
                        pattern[selectors[i]].filter(function(rule){
                            var property = rule.as.split("[n]")
                            if (!property[1].length){
                                results[property[0]] = getValuesAsElements(rule, elements[selectors])
                            }
                            else{
                                if(typeof asProperties[property[0]] === "undefined"){
                                    asProperties[property[0]] = {}
                                    if(typeof results[property[0]] === "undefined"){
                                        results[property[0]] = []
                                    }
                                }
                                if(typeof asProperties[property[0]][selectors[i]] === "undefined"){
                                    asProperties[property[0]][selectors[i]] = []
                                }
                                asProperties[property[0]][selectors[i]].push({property : property[1], rule : rule})
                            }
                        })
                    }
                    Object.getOwnPropertyNames(asProperties).filter(function(name){
                        results[name] = results[name].concat(getValuesAsProperties(asProperties[name], elements))
                    })
                    return results
                },
                function(result){
                    if(typeof result.error !== "undefined"){
                        callback(result.error)
                    }
                    else{
                        callback(false, result)
                    }
                })

            } catch(err) {
                callback(err, results)
            }
        }
    })
}

module.exports = scrapeasy
