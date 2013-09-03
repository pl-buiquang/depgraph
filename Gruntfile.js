module.exports = function(grunt) {

  grunt.initConfig({
    // read the package definition of the project
    pkg: grunt.file.readJSON('package.json'),
    
    concat: {
      options: {
        // define a string to put between each file in the concatenated output
        separator: ';'
      },
      base : {
        // the files to concatenate
        src: ['src/js/app/*.js'],
        // the location of the resulting JS file
        dest: 'build/<%= pkg.name %>.js'
      },
      
      mgwiki : {
     // the files to concatenate
        src: ['src/js/app/*.js','src/js/plugins/*.js'],
        // the location of the resulting JS file
        dest: 'build/mgwiki.<%= pkg.name %>.js'
      }
      
    },
    
    uglify: {
      options: {
        // the banner is inserted at the top of the output
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      base: {
        files: {
          'build/<%= pkg.name %>.min.js': ['<%= concat.base.dest %>']
        }
      },
      mgwiki:{
        files:{
          'build/mgwiki.<%= pkg.name %>.min.js': ['<%= concat.base.dest %>']
        }
      }
    }
    
  });
  
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  
  grunt.registerTask('mgwiki_prod', ['concat:mgwiki', 'uglify:mgwiki']);
  grunt.registerTask('mgwiki_dev',['concat:mgwiki']);
  grunt.registerTask('base_prod', ['concat:base', 'uglify:base']);
  grunt.registerTask('base_dev',['concat:base']);


};
