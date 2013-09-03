module.exports = function(grunt) {

  grunt.initConfig({
    // read the package definition of the project
    pkg: grunt.file.readJSON('package.json'),
    
    requirejs: {
      compile: {
        options: {
          baseUrl: "src/js/",
          name : 'depgraph',
          mainConfigFile: "config.js",
          out: "depgraph_optim.js",
          optimize: "none",
        }
      }
    }
    
  });
  
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  
  grunt.registerTask('compile',['requirejs']);


};