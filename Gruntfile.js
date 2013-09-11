module.exports = function(grunt) {

  grunt.initConfig({
    // read the package definition of the project
    pkg: grunt.file.readJSON('package.json'),
    
    concat: {

        base : {
          src: [
                'src/js/app/depgraphlib.js',
                'src/js/app/utils/**/*.js',
                'src/js/app/ui/**/*.js',
                'src/js/app/graph/**/*.js',
                'src/js/app/edition/**/*.js',
               ],
          dest: 'build/<%= pkg.name %>.js'
        },
        mgwiki : {
          src: ['build/<%= pkg.name %>.js','src/js/plugins/*.js'],
          dest: 'build/mgwiki.<%= pkg.name %>.js'
        }

      },
      
      uglify: {
        options: {
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
        },
        base: {
         files: {
            'build/<%= pkg.name %>.min.js': ['<%= concat.base.dest %>']
          }
        },
        mgwiki:{
          files:{
            'build/mgwiki.<%= pkg.name %>.min.js': ['<%= concat.mgwiki.dest %>']
           }
         }
      },
      
      
      copy: {
        css: {
          files: [
            {expand: true, cwd: 'src/', src: ['style/**'], dest: 'build/'}, 
          ]
        },
      },
      
      clean: {
        all : ['build/*'],
        css : ['build/style/*'],
      },
      
      jsdoc : {
        dist : {
            src: ['src/js/app/**/*.js', 'src/js/plugins/**/*.js'], 
            options: {
                destination: 'doc'
            }
        }
      },
    
  });
  
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-jsdoc');
  
  grunt.registerTask('style',['clean:css','copy:css']);
  grunt.registerTask('mgwiki_prod',['concat:base','concat:mgwiki','uglify:mgwiki']);
  grunt.registerTask('mgwiki_dev',['concat:base','concat:mgwiki']);
  grunt.registerTask('base_prod',['concat:base','uglify:base']);
  grunt.registerTask('base_dev',['concat:base']);
  grunt.registerTask('build_all',[
                                  'concat:base','concat:mgwiki','uglify:mgwiki',
                                  'concat:base','concat:mgwiki',
                                  'concat:base','uglify:base',
                                  'concat:base'
                                  ]);
};
