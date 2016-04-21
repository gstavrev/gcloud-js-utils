var program = require('commander')
var request = require('request')
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');

program
  .arguments('<token>')
  .option('-p, --purge','How often to ping back, in seconds')
  .parse(process.argv);

() => {
  console.log("Going to purge old versions");
  const child = exec('gcloud preview app versions list > versions.txt',
    (error, stdout, stderr) => {
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      if (error !== null) {
        console.log(`exec error: ${error}`);
      }
      else{
        var filePath = path.join(__dirname, 'versions.txt');
        fs.readFile(filePath, function(err, data){
          if (err){
            console.log("Error reading downloaded versions file");
          }
          else {
            var lines = data.toString().split("\n");
            for (var i = 0; i < lines.length; i++){
              if (isHeader(lines[i]) || lines[i].length == 0)
                continue;

              //split on space
              var parsed = cleanUpValues(lines[i].split(" "));
              var version = getVersion(parsed);
              console.log("%s %s %s", getModule(parsed), getTrafficSplit(parsed), version);
              if (getTrafficSplit(parsed) == "0.00"){
                console.log("Removing unused version %s", version);
                var command = 'gcloud preview app versions delete ' + version + ' -q';
                console.log("Preview: %s", command);
                const kills = exec(command,
                  (error, stdout, stderr) => {
                    console.log(`stdout: ${stdout}`);
                    console.log(`stderr: ${stderr}`);
                    if (error !== null) {
                      console.log(`exec error: ${error}`);
                    }
                  });
              }
            }
          }
        });
      }
  });
}();

var cleanUpValues = function(parsed){
  while(parsed.indexOf("") >= 0){
    parsed.splice(parsed.indexOf(""), 1);
  }
  return parsed;
}

var isHeader = function(line){
  return line.indexOf("SERVICE  VERSION") >= 0;
}

var getVersion = function(line){
  return line[1];
}

var getModule = function(line){
  return line[0];
}

var getTrafficSplit = function(line){
  return line[2];
}
