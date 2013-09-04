module.exports = function(grunt) {

  grunt.initConfig({
    // read the package definition of the project
    pkg: grunt.file.readJSON('package.json'),
    
    requirejs: {
      options: {
        baseUrl: "src/js/",
      },
      mgwiki_dev : {
        options :{
          name : 'mgwiki.depgraph.main',
          out : "build_requirejs/mgwiki.<%= pkg.name %>.js",
          optimize : "none",
        }
      },
      mgwiki_prod : {
        options :{
          name : 'mgwiki.depgraph.main',
          out : "build_requirejs/mgwiki.<%= pkg.name %>.min.js",
        }
      },
      base_dev : {
        options :{
          name : 'base.depgraph.main',
          out : "build_requirejs/<%= pkg.name %>.js",
          optimize : "none",
        }
      },
      base_prod : {
        options :{
          name : 'base.depgraph.main',
          out : "build_requirejs/<%= pkg.name %>.min.js"
        }
      },
    },
    
    concat: {
        base : {
          src: ['src/js/app/depgraphlib.js',
                'src/js/app/graphviewer.js',
                'src/js/app/editobject.js',
                'src/js/app/graphlayout.js',
                'src/js/app/defaulteditmode.js',
                'src/js/app/anticross.js',],
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
            {expand: true, cwd: 'src/', src: ['style/**'], dest: 'build_requirejs/'}, 
            {expand: true, cwd: 'src/', src: ['style/**'], dest: 'build/'}, 
          ]
        },
        requirejs:{
          files: [
            {expand: true, cwd: 'src/js/vendor/', src: ['require.js'], dest: 'build_requirejs/'}, 
          ]
        }
      },
      
      clean: {
        all : ['build_requirejs/*','build/*'],
        css : ['build_requirejs/style/*','build/style/*'],
      },
      
      
    
  });
  
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-clean');
  
  grunt.registerTask('style',['clean:css','copy:css']);
  grunt.registerTask('requirejs_mgwiki_prod',['copy:requirejs','requirejs:mgwiki_prod']);
  grunt.registerTask('requirejs_mgwiki_dev',['copy:requirejs','requirejs:mgwiki_dev']);
  grunt.registerTask('requirejs_base_prod',['copy:requirejs','requirejs:base_prod']);
  grunt.registerTask('requirejs_base_dev',['copy:requirejs','requirejs:base_dev']);
  grunt.registerTask('mgwiki_prod',['concat:base','concat:mgwiki','uglify:mgwiki']);
  grunt.registerTask('mgwiki_dev',['concat:base','concat:mgwiki']);
  grunt.registerTask('base_prod',['concat:base','uglify:base']);
  grunt.registerTask('base_dev',['concat:base']);
  grunt.registerTask('build_all',[
                                  'copy:requirejs',
                                  'requirejs:mgwiki_prod',
                                  'requirejs:mgwiki_dev',
                                  'requirejs:base_prod',
                                  'requirejs:base_dev',
                                  'concat:base','concat:mgwiki','uglify:mgwiki',
                                  'concat:base','concat:mgwiki',
                                  'concat:base','uglify:base',
                                  'concat:base'
                                  ]);
};